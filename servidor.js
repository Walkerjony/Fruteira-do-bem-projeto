const express = require('express');
const mysql = require('mysql');
const formidable = require('formidable');
const fs = require('fs');
const crypto = require('crypto');
const bodyParser = require('body-parser')
const mv = require('mv');
const path = require('path');
const multer = require('multer')
const bcrypt = require("bcrypt");
const saltRounds = 10;
var session = require('express-session');
const app = express();
const upload = multer({ dest: 'public/imagens/' }); // Destination folder for uploaded files

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true }))
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static("public"));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "FruteiraDoBem"
});

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
}));

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado com sucesso");
});

app.use((req, res, next) => {
    id = req.session.userId;
    var sql = "SELECT * FROM clientes where id = ?";
    con.query(sql, id, function (err, result) {
        const dadosUsuario = result;
        res.locals.dadosUsuario = dadosUsuario;
        next();
    });
});

app.use((req, res, next) => {
    id = req.session.userId;
    var sql = "SELECT * FROM clientes where id = ?";
    con.query(sql, id, function (err, result) {
        const dadosUsuario = result;
        res.locals.dadosUsuario = dadosUsuario;
        next();
    });
});

app.use((req, res, next) => {
    id = req.session.fruteiraId;
    var sql = "SELECT * FROM fruteira where id = ?";
    con.query(sql, id, function (err, result) {
        const dadosFruteira = result;
        res.locals.dadosFruteira = dadosFruteira;
        next();
    });
});

app.get('/', function (req, res) {
    res.render('home.ejs');
});

app.get('/cliente', function (req, res) {
    if (req.session.logado) {
        const userId = req.session.userId
        const sql = "SELECT * from clientes WHERE id = ?";
        con.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Erro', err);
                throw err;
            }
            const dados = result[0];
            res.render('cliente.ejs', { dados: dados });
        });
    } else {
        res.redirect('/loginFruteira');
    }
});

app.get('/editarDadosCliente', function (req, res) {
    if(req.session.logado){
        var userId = req.session.userId;
        const sql = "SELECT * from clientes WHERE id = ?";
        con.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Erro', err);
                throw err;
            } 
        res.render('editarDadosCliente.ejs', {dadosCliente: result});
        });
    }
    else{
        res.redirect('/loginUsuario');
    }
});

app.post('/editarDadosCliente', upload.single('imagem'), function (req, res) {
    var userId = req.session.userId;
    var nome = req.body.nome;
    var email = req.body.email;
    var endereco = req.body.endereco;



    const imagemFile = req.file;

    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + imagemFile.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);


    var updateDados = "UPDATE clientes SET nome = ?, email = ?, endereco = ?, imagem = ? WHERE id = ?";
    con.query(updateDados, [nome, email, endereco, nomeimg, userId], function (err, result) {

        fs.rename(imagemFile.path, newpath, (err) => {
            if (err) {
                console.error('Error moving file:', err);
                throw err;
            }
        })

        const img = path.join(__dirname, 'public/imagens/', nomeimg);
        fs.unlink(img, (err) => {

        });

        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
    });
    res.redirect('/cliente');
})


app.post('/cadastroUsuario', upload.single('imagem'), function (req, res) {
    const { nome, email, senha, endereco, estado, cidade } = req.body;
    const imagemFile = req.file;

    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + imagemFile.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);

    fs.rename(imagemFile.path, newpath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            throw err;
        }

        // Verifique se o e-mail já está cadastrado
        const checkEmailQuery = 'SELECT email FROM clientes WHERE email = ?';
        con.query(checkEmailQuery, [email], (err, results) => {
            if (err) {
                console.error('Error checking email:', err);
                throw err;
            }

            if (results.length > 0) {
                // E-mail já existe, imprima uma mensagem de erro
                res.render('cadastroUsuario.ejs', { mensagem: 'Este e-mail já foi cadastrado. Por favor, escolha outro e-mail.' });
            } else {
                // E-mail não existe, continue com o cadastro
                bcrypt.hash(senha, saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        throw err;
                    }

                    const insertUserQuery = 'INSERT INTO clientes (nome, email, senha, endereco, estado, cidade, imagem) VALUES ?';
                    const values = [[nome, email, hash, endereco, estado, cidade, nomeimg]];
                    con.query(insertUserQuery, [values], (err, result) => {
                        if (err) {
                            console.error('Error inserting data into MySQL:', err);
                            throw err;
                        }

                        res.redirect('/loginUsuario');
                    });
                });
            }
        });
    });
});


app.get('/cadastroUsuario', function (req, res) {
    res.render('cadastroUsuario.ejs', { mensagem: null });
});

app.post('/editarProduto/:id', upload.single('imagem'), function (req, res) {
    var id = req.params.id;
    var nomeProduto = req.body.nomeProduto;
    var descricao = req.body.descricao;
    var preco = req.body.preco
    const imagem = req.file;

    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + imagem.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);

    var updateDados = "UPDATE produtos SET nomeProduto = ?, descricao = ?, preco = ?, imagem = ? WHERE id = ?";
    con.query(updateDados, [nomeProduto, descricao, preco, nomeimg, id], function (err, result) {
        fs.rename(imagem.path, newpath, (err) => {
            if (err) {
                console.error('Error moving file:', err);
                throw err;
            }
        })

        const img = path.join(__dirname, 'public/imagens/', nomeimg);
        fs.unlink(img, (err) => {

        });
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
    });
    res.redirect('/produtosAnunciados');
});

app.post('/editarDados', upload.single('imagem'), function (req, res) {
    var fruteiraId = req.session.fruteiraId;
    var nome = req.body.nome;
    var email = req.body.email;
    var CNPJ = req.body.CNPJ;
    var endereco = req.body.endereco;
    var instagram = req.body.instagram;
    var telefone = req.body.telefone;


    const logoFile = req.file;

    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + logoFile.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);


    var updateDados = "UPDATE fruteira SET nome = ?, email = ?, CNPJ = ?, endereco = ?, instagram = ?, telefone = ?, logo = ? WHERE id = ?";
    con.query(updateDados, [nome, email, CNPJ, endereco, instagram, telefone, nomeimg, fruteiraId], function (err, result) {

        fs.rename(logoFile.path, newpath, (err) => {
            if (err) {
                console.error('Error moving file:', err);
                throw err;
            }
        })

        const img = path.join(__dirname, 'public/imagens/', nomeimg);
        fs.unlink(img, (err) => {

        });

        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
    });
    res.redirect('/perfilFruteira');
})

app.get('/excluirProduto/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var selectQuery = "SELECT * FROM produtos where id = ?";

        con.query(selectQuery, id, function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
                var deletarQuery = "DELETE FROM produtos WHERE id = ?";
                con.query(deletarQuery, id, function (err, deleteResult) {
                    if (err) throw err;
                    console.log("Registros apagados: " + deleteResult.affectedRows);
                    res.redirect('/produtosAnunciados');
                });
            } else {
                res.redirect('/perfilFruteira');
            }
        });
    } else {
        res.redirect('/loginFruteira');
    }
});








app.get('/editarProduto/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "SELECT * FROM produtos where id=?";
        con.query(sql, id, function (err, result) {
            if (err) throw err;
            res.render('editarDadosProduto', { products: result });
        });
    } else {
        res.redirect('/loginFruteira');
    }
});




app.post('/loginUsuario', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email']
    var sql = "SELECT * FROM clientes where email = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nome'];
                    req.session.userId = result[0]['id'];
                    req.session.estadoUser = result[0]['estado'];
                    res.redirect('/fruteiras');
                }
                else { res.render('loginUsuario', { mensagem: "Senha inválida" }) }
            });
        }
        else { res.render('loginUsuario.ejs', { mensagem: "E-mail não encontrado" }) }
    });
});

app.get('/loginUsuario', function (req, res) {
    res.render('loginUsuario.ejs', { mensagem: null });
});




app.post('/cadastroFruteira', upload.single('logo'), (req, res) => {
    const { nome, email, CNPJ, senha, endereco, estado, cidade, instagram, telefone } = req.body;
    const logoFile = req.file;

    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + logoFile.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);

    fs.rename(logoFile.path, newpath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            throw err;
        }

        // Verifique se o e-mail ou CNPJ já estão cadastrados
        const checkEmailCNPJQuery = 'SELECT email, CNPJ FROM fruteira WHERE email = ? OR CNPJ = ?';
        con.query(checkEmailCNPJQuery, [email, CNPJ], (err, results) => {
            if (err) {
                console.error('Error checking email and CNPJ:', err);
                throw err;
            }

            if (results.length > 0) {
                // E-mail ou CNPJ já existem, imprima uma mensagem de erro
                res.render('cadastroFruteira.ejs', { mensagem: 'Este e-mail ou CNPJ já foram cadastrados. Por favor, escolha outro e-mail ou CNPJ.' });
            } else {
                // E-mail e CNPJ não existem, continue com o cadastro
                bcrypt.hash(senha, saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        throw err;
                    }

                    const insertFruteiraQuery = 'INSERT INTO fruteira (nome, email, CNPJ, senha, endereco, estado, cidade, instagram, telefone, logo) VALUES ?';
                    const values = [[nome, email, CNPJ, hash, endereco, estado, cidade, instagram, telefone, nomeimg]];
                    con.query(insertFruteiraQuery, [values], (err, result) => {
                        if (err) {
                            console.error('Error inserting data into MySQL:', err);
                            throw err;
                        }

                        console.log('Data inserted into MySQL successfully');
                        res.redirect('/loginFruteira');
                    });
                });
            }
        });
    });
});




app.get('/cadastroFruteira', function (req, res) {
    res.render('cadastroFruteira.ejs', { mensagem: null });
});

app.post('/loginFruteira', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email']
    var sql = "SELECT * FROM fruteira where email = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nome'];
                    req.session.fruteiraId = result[0]['id']
                    res.redirect('/anunciarProduto');
                }
                else { res.render('loginFruteira', { mensagem: "Senha inválida" }) }
            });
        }
        else { res.render('loginFruteira.ejs', { mensagem: "E-mail não encontrado" }) }
    });
});



app.get('/loginFruteira', function (req, res) {
    res.render('loginFruteira.ejs', { mensagem: null });
});


app.get('/comofunciona', function (req, res) {
    res.render('comoFunciona.ejs');
});
app.get('/fruteiras', function (req, res) {
    if (req.session.logado) {
        var idUsuario = req.session.userId;
        var sql = "SELECT * FROM fruteira WHERE estado = (SELECT estado FROM clientes WHERE id = ?)"
        con.query(sql, idUsuario, function (err, result, fields) {
            if (err) throw err;
            res.render('fruteiras.ejs', { dadosFruteira: result, req })
        });
    } else {
        res.redirect('/loginUsuario');
    }
});

let palavraChave = '';
app.post('/pesquisar', function (req, res) {
    if (req.session.logado) {
        var palavraChave = req.body.palavraChave;
        var estado = req.session.estadoUser
        var sql = "SELECT * FROM fruteira WHERE (nome LIKE ? OR cidade LIKE ?) AND estado = ?";

        let params = [`%${palavraChave}%`, `%${palavraChave}%`, estado];

        con.query(sql, params, function (err, result, fields) {
            if (err) throw err;
            res.render('fruteiras.ejs', { dadosFruteira: result, palavraChave: palavraChave, req })
        });
    } else {
        res.redirect('/loginUsuario');
    }
});

app.get('/pedidoFinalizado', function (req, res) {
    if (req.session.logado) {
        res.render('pedidoFinalizado.ejs');
    }
    else {
        res.redirect('/loginUsuario');
    }
});




app.get('/perfilFruteira', function (req, res) {
    if (req.session.logado) {
        const fruteiraId = req.session.fruteiraId
        const sql = "SELECT * from fruteira WHERE id = ?";
        con.query(sql, [fruteiraId], (err, result) => {
            if (err) {
                console.error('Error fetching fruteira data from MySQL:', err);
                throw err;
            }
            const fruteiraData = result[0];
            res.render('perfilFruteira.ejs', { fruteiraData: fruteiraData });
        });
    } else {
        res.redirect('/loginFruteira');
    }
});


app.get('/editarDados', function (req, res) {
    if(req.session.logado){
        var fruteiraId = req.session.fruteiraId;
        var sql = "SELECT * FROM fruteira where id=?";
        con.query(sql, fruteiraId, function(err, result){
            if(err) throw err;
            res.render('editarDados.ejs', {dadosFruteiraEdit: result});
        });
    }
    else{
        res.redirect('/loginFruteira');
    }
});

app.get('/anunciarProduto', function (req, res) {
    if (req.session.logado) {
        res.render('anunciarProduto.ejs');
    }
    else {
        res.redirect('/loginFruteira');
    }
});


app.get('/produtosAnunciados', function (req, res) {
    if (req.session.logado) {
        var id = req.session.fruteiraId;
        var selectQuery = "SELECT * FROM produtos WHERE id_fruteira = ?";
        con.query(selectQuery, id, function (err, products) {
            if (err) {
                console.log(err);
            }
            res.render('produtosAnunciados', { products: products });
        })
    }
    else {
        res.redirect('/loginFruteira');
    }
});

app.post('/anunciarProduto', upload.single('imagem'), function (req, res) {
    var imagem = req.file;
    var fruteiraId = req.session.fruteiraId;
    const hashImagem = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const nomeimg = hashImagem + '.' + imagem.mimetype.split('/')[1];
    const newpath = path.join(__dirname, 'public/imagens/', nomeimg);

    fs.rename(imagem.path, newpath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            throw err;
        }
    });
    var sql = "INSERT INTO produtos (id_fruteira, nomeProduto, preco, imagem, descricao) VALUES ?";
    var values = [
        [fruteiraId, req.body['nomeProduto'], req.body['preco'], nomeimg, req.body['descricao']]
    ];
    con.query(sql, [values], function (err, result) {
        if (err) {
            console.log(err)
        };
    });
    res.redirect('/produtosAnunciados');
});

app.get('/produtos/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "SELECT * FROM produtos WHERE id_fruteira = ?";
        con.query(sql, id, function (err, result, fields) {
            res.render('produtos.ejs', { dadosProdutos: result })

        });
    } else {
        res.redirect('/loginUsuario');
    }
});

app.post('/addCarrinho/:id', function (req, res) {
    if (req.session.logado) {
        var idProduto = req.params.id;
        var quantidade = req.body["quantidade"];
        var idUsuario = req.session.userId;

        var sql1 = "SELECT id_carrinho FROM carrinho WHERE id_usuario = ?";
        con.query(sql1, [idUsuario], (err, result1) => {
            var id_carrinho = result1[0] ? result1[0].id_carrinho : null;

            var sql;
            if (id_carrinho) {
                sql = "INSERT INTO carrinho (id_produto, id_usuario, quantidade, id_carrinho) VALUES (?, ?, ?, ?)";
            } else {
                sql = "INSERT INTO carrinho (id_produto, id_usuario, quantidade) VALUES (?, ?, ?)";
            }

            con.query(sql, [idProduto, idUsuario, quantidade, id_carrinho], function (err, insertResult) {
                if (err) {
                    const sql = `SELECT A.*, B.quantidade AS quantidade FROM produtos A INNER JOIN carrinho B ON A.id = B.id_produto WHERE B.id_usuario = ?`;
                    con.query(sql, [idUsuario], (err, carrinhoResult) => {
                        var idUsuario = req.session.userId;
                        const subquery = 'SELECT C.id_fruteira FROM produtos C INNER JOIN carrinho D ON C.id = D.id_produto WHERE D.id_usuario = ? ORDER BY D.data_insercao DESC LIMIT 1';

                        con.query(subquery, [idUsuario, idUsuario], (err, fruteiraResult) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            const idFruteira = fruteiraResult[0] ? fruteiraResult[0].id_fruteira : null;

                            res.render('carrinho.ejs', { produtosCarrinho: carrinhoResult, idFruteira, req, mensagem: "Não é possível adicionar ao carrinho, pois o produto já está adicionado!" });
                        });
                    });
                } else {
                    res.redirect('/carrinho');
                }
            });
        });
    } else {
        res.redirect('/loginUsuario');
    }
});

app.get('/excluiCarrinho/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = "DELETE FROM carrinho WHERE id_produto = ?";
        con.query(sql, id, function (err, result) {
            if (err) throw err;
            res.redirect('/carrinho');
        });

    } else {
        res.redirect('/loginUsuario');
    }
});

app.get('/carrinho', function (req, res) {
    if (req.session.logado) {
        const userId = req.session.userId;

        const sql = 'SELECT A.*, B.quantidade AS quantidade FROM produtos A INNER JOIN carrinho B ON A.id = B.id_produto WHERE B.id_usuario = ?';

        con.query(sql, [userId], (err, carrinhoResult) => {
            if (err) {
                console.error(err);
                return;
            }

            const subquery = 'SELECT C.id_fruteira FROM produtos C INNER JOIN carrinho D ON C.id = D.id_produto WHERE D.id_usuario = ? ORDER BY D.data_insercao DESC LIMIT 1';

            con.query(subquery, [userId, userId], (err, fruteiraResult) => {
                if (err) {
                    console.error(err);
                    return;
                }

                const idFruteira = fruteiraResult[0] ? fruteiraResult[0].id_fruteira : null;

                res.render('carrinho.ejs', { produtosCarrinho: carrinhoResult, idFruteira, req, mensagem: null });
            });
        });
    }
    else {
        res.redirect('/loginUsuario');
    }
});

app.get('/fecharCompra', function (req, res) {
    if (req.session.logado) {
        const userId = req.session.userId
        var valor_total = req.session.valorTotal;
        var sql1 = "INSERT INTO pedidos (id_usuario, valor) VALUES (?, ?)";
        con.query(sql1, [userId, valor_total], function (err, insertResult) {
            const sql = "SELECT endereco, nome from clientes WHERE id = ?";
            con.query(sql, [userId], (err, result) => {
                if (err) {
                    console.error('Erro', err);
                    throw err;
                }
                const dados = result[0];
                res.render('fechamentoEndereco.ejs', { dados: dados });
            });
        });

    } else {
        res.redirect('/loginFruteira');
    }
});

app.post('/addEntrega', function (req, res) {
    if (req.session.logado) {
        var formaEntrega = req.body.endereco;
        var idUsuario = req.session.userId;
        var valor_total = req.session.valorTotal;

        var sql = "UPDATE pedidos SET entrega = ? WHERE id_usuario = ? AND valor = ?";
        con.query(sql, [formaEntrega, idUsuario, valor_total], function (err, insertResult) {
            if (err) {
                console.error(err);
            }
            res.redirect('/pagamento');
        });

    } else {
        res.redirect('/loginUsuario');
    }
});

app.get('/pagamento', function (req, res) {
    if (req.session.logado) {
        res.render('pagamento.ejs');
    }
    else {
        res.redirect('/loginUsuario');
    }
});

app.post('/finalizarCompra', function (req, res) {
    if (req.session.logado) {
        var pagamento = req.body.pagamento;
        var idUsuario = req.session.userId;
        var valor_total = req.session.valorTotal;
        var sql = "UPDATE pedidos SET pagamento = ? WHERE id_usuario = ? AND valor = ?";
        con.query(sql, [pagamento, idUsuario, valor_total], function (err, insertResult) {
            var sql2 = "DELETE FROM carrinho WHERE id_usuario = ?";
            con.query(sql2, [idUsuario], function (err, insertResult) {
                res.redirect('/pedidoFinalizado');
            });
        });

    } else {
        res.redirect('/loginUsuario');
    }
});

app.get('/clientePedidos', function (req, res) {
    if (req.session.logado) {
        var idUsuario = req.session.userId;
        var sql = "SELECT * FROM pedidos WHERE id_usuario = ?";
        con.query(sql, idUsuario, function (err, result, fields) {
            res.render('clientePedidos.ejs', { dadosPedidos: result })

        });
    }
    else {
        res.redirect('/loginUsuario');
    }
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
    })
    res.redirect('/loginUsuario');
});

app.listen(3000, function () {
    console.log("Servidor Escutando na porta 3000");
});