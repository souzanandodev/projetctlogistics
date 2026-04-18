// server.js
const express = require('express');
const mariadb = require('mariadb');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do pool de conexão com o MariaDB
const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'appuser',
    password: process.env.DB_PASSWORD || 'DBlog*1234@', // 🚨 CONFIRA SUA SENHA AQUI
    database: process.env.DB_NAME || 'logistica_db',
    connectionLimit: 5
});

// Middleware para processar JSON e dados de formulário
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_muito_secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mude para true em produção (HTTPS)
}));

// Middleware de autenticação simples
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ message: 'Não autorizado. Faça o login.' });
        }
        res.redirect('/');
    }
}

// Servir arquivos estáticos (CSS, JS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------- ROTAS DE AUTENTICAÇÃO E USUÁRIO ----------------------

// 1. Endpoint para Login (POST)
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        
        const userRows = await conn.query("SELECT id, usuario, senha FROM usuarios WHERE usuario = ?", [usuario]);

        if (userRows.length === 0) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }
        
        const user = userRows[0];
        const match = await bcrypt.compare(senha, user.senha);

        if (match) { 
            req.session.userId = user.id; 
            return res.status(200).json({ message: 'Login bem-sucedido!' });
        } else {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        console.error("Erro no login:", err); 
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// 2. Rota para Sair (Logout)
app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao fazer logout.' });
        }
        res.redirect('/');
    });
});

// 3. Endpoint para buscar informações do usuário logado (usado no menu)
app.get('/api/usuario', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT usuario FROM usuarios WHERE id = ?", [req.session.userId]); 
        
        if (rows.length > 0) {
            res.json({ usuario: rows[0].usuario });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao buscar usuário logado:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// ---------------------- ROTAS DE ENTIDADES ----------------------

// 4. Endpoint para Cadastro de Entidades (Clientes/Fornecedores)
app.post('/api/entidades', isAuthenticated, async (req, res) => {
    
    const { 
        nome_fantasia, razao_social, tipo, cnpj_cpf, 
        endereco, cidade, estado, telefone, email 
    } = req.body;
    
    let conn;
    try {
        conn = await pool.getConnection();

        const result = await conn.query(
            `INSERT INTO entidades (nome_fantasia, razao_social, tipo, cnpj_cpf, endereco, cidade, estado, telefone, email) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                nome_fantasia, 
                razao_social, 
                tipo, 
                cnpj_cpf, 
                endereco, 
                cidade, 
                estado, 
                telefone, 
                email
            ]
        );

        const newId = Number(result.insertId); 

        res.status(201).json({ 
            message: 'Entidade cadastrada com sucesso!', 
            id: newId
        });

    } catch (err) {
        console.error("Erro ao cadastrar entidade:", err);
        
        if (err.code && (err.code.includes('ER_DUP_ENTRY') || err.code.includes('1062'))) {
            return res.status(400).json({ 
                message: 'Erro de cadastro: CNPJ/CPF já existe ou dado duplicado.',
                error: err.sqlMessage
            });
        }
        
        res.status(500).json({ 
            message: 'Erro interno ao cadastrar entidade.', 
            error: err.message 
        });
    } finally {
        if (conn) conn.release();
    }
});

// 4.1. Endpoint para Listar Entidades (Para Dropdowns)
app.get('/api/entidades', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT id, razao_social, nome_fantasia FROM entidades ORDER BY nome_fantasia ASC"
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar entidades:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao listar entidades.' });
    } finally {
        if (conn) conn.release();
    }
});

// 4.2. Endpoint para Listar TODAS as Entidades com Detalhes (Para Tabela) 🚨 NOVO!
app.get('/api/entidades/detalhes', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            // Traz todos os campos da entidade
            "SELECT * FROM entidades ORDER BY razao_social ASC"
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar entidades detalhadas:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao listar entidades.' });
    } finally {
        if (conn) conn.release();
    }
});

// 4.3. Endpoint para Buscar Entidade por ID (GET /:id)
app.get('/api/entidades/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM entidades WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Entidade não encontrada.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`Erro ao buscar entidade ID ${id}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// 4.4. Endpoint para Atualizar Entidade (PUT /:id)
app.put('/api/entidades/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const {
        nome_fantasia,
        razao_social,
        tipo,
        cnpj_cpf,
        endereco,
        cidade,
        estado,
        telefone,
        email
    } = req.body;

    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE entidades SET 
                nome_fantasia = ?, 
                razao_social = ?, 
                tipo = ?, 
                cnpj_cpf = ?, 
                endereco = ?, 
                cidade = ?, 
                estado = ?, 
                telefone = ?, 
                email = ?
            WHERE id = ?
        `;

        const result = await conn.query(query, [
            nome_fantasia,
            razao_social,
            tipo,
            cnpj_cpf,
            endereco,
            cidade,
            estado,
            telefone,
            email,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entidade não encontrada para atualização.' });
        }

        res.json({ message: `Entidade ${id} atualizada com sucesso!` });
    } catch (err) {
        console.error(`Erro ao atualizar entidade ID ${id}:`, err);

        if (err.code && (err.code.includes('ER_DUP_ENTRY') || err.code.includes('1062'))) {
            return res.status(400).json({ 
                message: 'Erro de atualização: CNPJ/CPF já existe.',
                error: err.sqlMessage
            });
        }

        res.status(500).json({ error: 'Erro interno do servidor ao atualizar entidade.' });
    } finally {
        if (conn) conn.release();
    }
});

// 4.5. Endpoint para Excluir entidade por ID (DELETE /:id)
app.delete('/api/entidades/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();

        // Verifica se há pedidos vinculados
        const pedidos = await conn.query(
            "SELECT COUNT(*) AS total FROM pedidos WHERE entidade_origem_id = ? OR entidade_destino_id = ?",
            [id, id]
        );

        if (pedidos[0].total > 0) {
            return res.status(400).json({
                message: 'Não é possível excluir: a entidade está vinculada a pedidos.'
            });
        }

        const result = await conn.query("DELETE FROM entidades WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entidade não encontrada para exclusão.' });
        }

        res.json({ message: `Entidade ID ${id} excluída com sucesso.` });
    } catch (err) {
        console.error(`Erro ao excluir entidade ID ${id}:`, err);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao excluir entidade.',
            error: err.sqlMessage || err.message
        });
    } finally {
        if (conn) conn.release();
    }
});

// ---------------------- ROTAS DE PEDIDOS ----------------------

// 5. Endpoint para Cadastro de Pedidos (POST) 🚨 CORRIGIDO: Removida a coluna 'observacoes'
app.post('/api/pedidos', isAuthenticated, async (req, res) => {

    const {
        codigo_rastreio,
        entidade_origem_id,
        entidade_destino_id,
        data_entrega_prevista,
        status, 
        descricao_carga,
        peso,
        valor_frete
    } = req.body;

    let conn;
    try {
        conn = await pool.getConnection();

        // Query corrigida: Removida a coluna 'observacoes'
        const result = await conn.query(
            `INSERT INTO pedidos (codigo_rastreio, entidade_origem_id, entidade_destino_id, data_entrega_prevista, status, descricao_carga, peso, valor_frete) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                codigo_rastreio,
                entidade_origem_id,
                entidade_destino_id,
                data_entrega_prevista,
                status,
                descricao_carga,
                peso,
                valor_frete
            ]
        );

        const newId = Number(result.insertId);

        res.status(201).json({ 
            message: 'Pedido cadastrado com sucesso!', 
            id: newId
        });

    } catch (err) {
        console.error("Erro ao cadastrar pedido:", err);

        if (err.code && (err.code.includes('ER_DUP_ENTRY') || err.code.includes('1062'))) {
            return res.status(400).json({ 
                message: 'Erro de cadastro: Código de rastreio já existe.',
                error: err.sqlMessage
            });
        }
        
        res.status(500).json({ 
            message: 'Erro interno ao cadastrar pedido.', 
            error: err.sqlMessage || err.message
        });
    } finally {
        if (conn) conn.release();
    }
});

// 6. Endpoint para Listar Todos os Pedidos (GET)
app.get('/api/pedidos', isAuthenticated, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT 
                p.id, p.codigo_rastreio, p.status, p.data_entrega_prevista, p.peso, p.valor_frete,
                eo.nome_fantasia AS nome_origem,
                ed.nome_fantasia AS nome_destino
            FROM 
                pedidos p
            JOIN 
                entidades eo ON p.entidade_origem_id = eo.id
            JOIN 
                entidades ed ON p.entidade_destino_id = ed.id
            ORDER BY 
                p.data_criacao DESC
        `;
        const rows = await conn.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar pedidos:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao listar pedidos.' });
    } finally {
        if (conn) conn.release();
    }
});

// 7. Endpoint para Buscar Pedido por ID (GET /:id)
app.get('/api/pedidos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT id, codigo_rastreio, entidade_origem_id, entidade_destino_id, data_entrega_prevista, status, descricao_carga, peso, valor_frete FROM pedidos WHERE id = ?", 
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Retorna o primeiro (e único) pedido
        res.json(rows[0]); 

    } catch (err) {
        console.error(`Erro ao buscar pedido ID ${id}:`, err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


// 8. Endpoint para Atualizar Pedido (PUT /:id)
app.put('/api/pedidos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const {
        codigo_rastreio,
        entidade_origem_id,
        entidade_destino_id,
        data_entrega_prevista,
        status, 
        descricao_carga,
        peso,
        valor_frete
    } = req.body;

    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE pedidos SET 
                codigo_rastreio = ?, 
                entidade_origem_id = ?, 
                entidade_destino_id = ?, 
                data_entrega_prevista = ?, 
                status = ?, 
                descricao_carga = ?, 
                peso = ?, 
                valor_frete = ?
            WHERE id = ?
        `;

        const result = await conn.query(query, [
            codigo_rastreio,
            entidade_origem_id,
            entidade_destino_id,
            data_entrega_prevista,
            status,
            descricao_carga,
            peso,
            valor_frete,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado para atualização.' });
        }

        res.json({ message: `Pedido ${id} atualizado com sucesso!` });

    } catch (err) {
        console.error(`Erro ao atualizar pedido ID ${id}:`, err);

        if (err.code && (err.code.includes('ER_DUP_ENTRY') || err.code.includes('1062'))) {
            return res.status(400).json({ 
                message: 'Erro de atualização: Código de rastreio já existe.',
                error: err.sqlMessage
            });
        }

        res.status(500).json({ error: 'Erro interno do servidor ao atualizar.' });
    } finally {
        if (conn) conn.release();
    }
});


// 9. Endpoint para Excluir Pedido (DELETE /:id)
app.delete('/api/pedidos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    let conn;

    try {
        conn = await pool.getConnection();

        const result = await conn.query("DELETE FROM pedidos WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado para exclusão.' });
        }

        res.json({ message: `Pedido ID ${id} excluído com sucesso.` });
        
    } catch (err) {
        console.error(`Erro ao excluir pedido ID ${id}:`, err);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao excluir pedido.',
            error: err.sqlMessage || err.message
        });
    } finally {
        if (conn) conn.release();
    }
});


// ---------------------- ROTA PADRÃO (Index) ----------------------

// Rota para a página de login (index.html)
app.get('/', (req, res) => {
    if (req.session.userId) {
        // Se estiver logado, redireciona para a home
        return res.redirect('/pages/home.html');
    }
    // Caso contrário, mostra a página de login
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Todas as outras rotas HTML após o login
// 🚨 CORREÇÃO: Usando o parâmetro nomeado ':page' para resolver o PathError
app.get('/pages/:page', isAuthenticated, (req, res) => {
    const page = req.params.page; // Captura o nome do arquivo (ex: home.html, listar_pedidos.html)
    const filePath = path.join(__dirname, 'public', 'pages', page);
    res.sendFile(filePath, (err) => {
        if (err) {
            // Se o arquivo não for encontrado, envia 404
            console.error(`Erro ao carregar página: ${filePath}`, err);
            res.status(404).send('Página não encontrada.');
        }
    });
});


// Inicialização do Servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    console.log('---');
    console.log('Rotas de API disponíveis:');
    console.log(' - POST /api/login');
    console.log(' - GET /api/logout');
    console.log(' - POST /api/entidades');
    console.log(' - GET /api/entidades');
    console.log(' - POST /api/pedidos (Cadastro)');
    console.log(' - GET /api/pedidos (Listagem)');
    console.log(' - GET /api/pedidos/:id (Busca)');
    console.log(' - PUT /api/pedidos/:id (Edição)');
    console.log(' - DELETE /api/pedidos/:id (Exclusão)');
    console.log('---');
});