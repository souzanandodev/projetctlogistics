# 🚚 Sistema de Gestão de Logística e Rastreabilidade

Este é um sistema **Full-Stack** avançado para controle logístico, focado em rastreabilidade, gestão de remessas e cadastro de parceiros (clientes e transportadoras). O projeto foi concebido para oferecer uma interface intuitiva para o gerenciamento de cargas, desde o registro inicial até a entrega final.

## 🏗️ Arquitetura de Infraestrutura (Edge Computing)
Um dos grandes diferenciais deste projeto é o seu ambiente de hospedagem, focado em baixo consumo e eficiência:
* **Hardware:** Orange Pi Zero 3 (Processador Quad-core ARM).
* **Sistema Operacional:** Armbian Linux.
* **Armazenamento de Dados:** HD externo montado em `/mnt/hdext` para garantir persistência e integridade dos arquivos.
* **Banco de Dados:** MariaDB rodando localmente na placa.

## 🛠️ Stack Tecnológica
| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Backend** | Node.js | Motor principal do servidor (`server.js`) |
| **Framework** | Express | Gerenciamento de rotas e APIs REST |
| **Banco de Dados** | MariaDB | Persistência de dados relacionais |
| **Segurança** | Bcrypt.js | Criptografia de senhas (hashing) |
| **Frontend** | HTML5 / CSS3 / JS | Interface responsiva e modular |

## 📦 Principais Funcionalidades
Com base na documentação do sistema, as funcionalidades implementadas incluem:

1. **Gestão de Entidades:** Cadastro, edição e exclusão de Clientes e Transportadoras.
2. **Controle de Pedidos:** * Registro de remessas com código de rastreio único.
    * Atribuição de pesos, volumes e valores de frete.
    * Vinculação direta entre remetente e transportadora.
3. **Sistema de Rastreabilidade:** Monitoramento do status do pedido (Pendente, Em Transporte, Entregue, Cancelado).
4. **Segurança de Acesso:** Sistema de login com sessões protegidas e autenticação robusta.

## 📂 Estrutura de Arquivos
* `server.js`: O "coração" da aplicação, contendo as rotas e lógica de negócio.
* `public/`: Contém os arquivos estáticos (HTML, CSS, JS do frontend).
* `hash_senha.js`: Script utilitário para gerar hashes de segurança para novos usuários.
* `.gitignore`: Configurado para proteger arquivos sensíveis como o `.env`.

## ⚙️ Como Instalar e Rodar
1. **Clone o projeto:**
   ```bash
   git clone [https://github.com/souzanandodev/projetctlogistics.git](https://github.com/souzanandodev/projetctlogistics.git)