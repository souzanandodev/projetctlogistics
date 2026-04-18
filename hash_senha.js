// hash_senha.js
const bcrypt = require('bcrypt');
const saltRounds = 10; // O mesmo custo que você usará na sua aplicação

// 🚨 SUBSTITUA 'sua_senha_do_admin' PELA SENHA ATUAL DO ADMIN 🚨
const senhaAdmin = 'admin'; // Exemplo: use a senha que você inseriu em texto puro

bcrypt.hash(senhaAdmin, saltRounds, (err, hash) => {
    if (err) {
        console.error("Erro ao gerar o hash:", err);
        return;
    }
    console.log("-----------------------------------------------------------------------");
    console.log("Senha Original: ", senhaAdmin);
    console.log("HASH GERADO (Copie este valor!): ");
    console.log(hash);
    console.log("-----------------------------------------------------------------------");
});