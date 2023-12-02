var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "FruteiraDoBem"
});
con.connect(function (err) {
    

    if (err) throw err;
    var sql2 = "CREATE TABLE fruteira (id INT AUTO_INCREMENT PRIMARY KEY,nome VARCHAR(60), email VARCHAR(255) UNIQUE, CNPJ VARCHAR(255) UNIQUE, senha VARCHAR(60), endereco VARCHAR(60), estado VARCHAR(255), cidade VARCHAR(255), instagram VARCHAR(255), telefone VARCHAR(60), logo VARCHAR(255))";
    con.query(sql2, function (err, result) {
        if (err) throw err;
        console.log("Tabela fruteira criada");
    });

    if (err) throw err;
    var sql3 = "CREATE TABLE produtos (id INT AUTO_INCREMENT PRIMARY KEY, id_fruteira INT, nomeProduto VARCHAR(60), preco DECIMAL(10,2), imagem VARCHAR (255), descricao VARCHAR(255), FOREIGN KEY (id_fruteira) REFERENCES fruteira(id))";
    con.query(sql3, function (err, result) {
        if (err) throw err;
        console.log("Tabela produtos criada");
    });
    
    if (err) throw err;
    var sql = "CREATE TABLE clientes (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(60), email VARCHAR(60) UNIQUE, senha VARCHAR(60),  endereco VARCHAR(60), estado VARCHAR(255), cidade VARCHAR(255), imagem VARCHAR(255))";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Tabela clientes criada");
    });

    if (err) throw err;
    var sql1 = "CREATE TABLE carrinho (id_carrinho INT AUTO_INCREMENT, id_produto INT, id_usuario INT, quantidade INT, data_insercao TIMESTAMP,PRIMARY KEY (id_carrinho, id_produto, id_usuario),FOREIGN KEY (id_produto) REFERENCES produtos(id),FOREIGN KEY (id_usuario) REFERENCES clientes(id))";
    con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("Tabela carrinho criada");
    });
    
    if (err) throw err;
    var sql2 = "CREATE TABLE pedidos (id_pedido INT AUTO_INCREMENT, id_usuario INT, valor DECIMAL(10,2), pagamento VARCHAR(50), entrega VARCHAR(100),PRIMARY KEY(id_pedido, id_usuario), FOREIGN KEY (id_usuario) REFERENCES clientes(id))";
    con.query(sql2, function (err, result) {
        if (err) throw err;
        console.log("Tabela pedidosRealizados criada");
    });
    con.end();
});
