document.addEventListener('DOMContentLoaded', () => {

    const listaDados = document.getElementById('lista-dados');

    // ------------------------------------------------------------------
    // Funções globais de manipulação de dropdown
    // ------------------------------------------------------------------
    function fecharTodosMenus(menuAtual = null) {
        const menus = document.querySelectorAll('.menu-conteudo');
        menus.forEach(menu => {
            if (menu !== menuAtual) {
                menu.classList.remove('mostra');
            }
        });
    }

    // ------------------------------------------------------------------
    // Listeners de pedidos (dropdown e ações)
    // ------------------------------------------------------------------
    function anexarListenersAcoesPedidos() {
        document.removeEventListener('click', fecharTodosMenus);
        document.addEventListener('click', fecharTodosMenus);

        document.querySelectorAll('.btn-menu-acoes').forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                const pedidoId = this.getAttribute('data-id');
                const menu = document.getElementById(`menu-${pedidoId}`);
                fecharTodosMenus(menu);
                menu.classList.toggle('mostra');
            });
        });

        document.querySelectorAll('.acao-visualizar').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                alert(`Funcionalidade de Visualização de Pedido (ID: ${id}) será implementada em breve!`);
                fecharTodosMenus();
            });
        });

        document.querySelectorAll('.acao-editar').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                window.location.href = `../cadastro/editar_pedido.html?id=${id}`;
                fecharTodosMenus();
            });
        });

        document.querySelectorAll('.acao-excluir').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                fecharTodosMenus();
                excluirPedido(id);
            });
        });
    }

    // ------------------------------------------------------------------
    // Carregar nome do usuário
    // ------------------------------------------------------------------
    async function carregarNomeUsuario() {
        const nomeUsuarioElement = document.getElementById('nome-usuario');
        if (!nomeUsuarioElement) return;

        try {
            const response = await fetch('/api/usuario');
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Falha ao buscar nome do usuário.');

            const data = await response.json();
            nomeUsuarioElement.textContent = data.usuario || 'Usuário Desconhecido';
        } catch (error) {
            console.error('Erro ao carregar nome do usuário:', error);
            nomeUsuarioElement.textContent = 'Erro de Rede';
        }
    }
    carregarNomeUsuario();

    // ------------------------------------------------------------------
    // Contagem de pedidos (home.html)
    // ------------------------------------------------------------------
    async function carregarContagemPedidos() {
        const cardsContainer = document.querySelector('.status-cards-container');
        if (!cardsContainer) return;

        try {
            const response = await fetch('/api/pedidos');
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Erro na resposta da rede ao buscar pedidos.');

            const pedidos = await response.json();
            const contadores = { 'PENDENTE': 0, 'EM_TRANSPORTE': 0, 'ENTREGUE': 0, 'CANCELADO': 0 };

            pedidos.forEach(pedido => {
                const status = (pedido.status || '').toUpperCase();
                if (contadores.hasOwnProperty(status)) contadores[status]++;
            });

            document.getElementById('count-pendente').textContent = contadores['PENDENTE'];
            document.getElementById('count-em_transporte').textContent = contadores['EM_TRANSPORTE'];
            document.getElementById('count-entregue').textContent = contadores['ENTREGUE'];
            document.getElementById('count-cancelado').textContent = contadores['CANCELADO'];

            if (listaDados) {
                listaDados.innerHTML = '<p>Contagem de Pedidos carregada com sucesso.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar contagem de pedidos:', error);
            cardsContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar a contagem de pedidos. Verifique o servidor.</p>';
        }
    }
    carregarContagemPedidos();

    // ------------------------------------------------------------------
    // Cadastro de entidades (cadastro_entidades.html)
    // ------------------------------------------------------------------
    const formEntidade = document.getElementById('form-cadastro-entidade');

    if (formEntidade) {
        formEntidade.addEventListener('submit', async (event) => {
            event.preventDefault();

            const msgRetorno = document.getElementById('mensagem-retorno');
            msgRetorno.textContent = 'Enviando dados...';
            msgRetorno.style.color = '#396FBA';

            const formData = new FormData(formEntidade);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/entidades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    msgRetorno.textContent = result.message || 'Cadastro realizado com sucesso!';
                    msgRetorno.style.color = 'green';
                    formEntidade.reset();
                } else if (response.status === 401) {
                    window.location.href = '/';
                } else {
                    msgRetorno.textContent = result.message || 'Erro desconhecido ao cadastrar.';
                    msgRetorno.style.color = 'red';
                    console.error('Erro de API no Cadastro Entidade:', result.error);
                }
            } catch (error) {
                console.error('Erro de rede ou cliente no Cadastro Entidade:', error);
                msgRetorno.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                msgRetorno.style.color = 'red';
            }
        });
    }

    // ------------------------------------------------------------------
    // Cadastro de pedidos (cadastro_pedidos.html)
    // ------------------------------------------------------------------
    const formPedido = document.getElementById('form-cadastro-pedido');

    async function popularDropdownEntidades() {
        const origemSelect = document.getElementById('entidade_origem_id');
        const destinoSelect = document.getElementById('entidade_destino_id');

        if (!origemSelect || !destinoSelect) return;

        try {
            const response = await fetch('/api/entidades');
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Falha ao buscar entidades.');

            const entidades = await response.json();

            origemSelect.innerHTML = '<option value="" disabled selected>--- Selecione uma Entidade ---</option>';
            destinoSelect.innerHTML = '<option value="" disabled selected>--- Selecione uma Entidade ---</option>';

            if (!Array.isArray(entidades) || entidades.length === 0) {
                origemSelect.innerHTML = '<option value="" disabled selected>Nenhuma entidade cadastrada!</option>';
                destinoSelect.innerHTML = '<option value="" disabled selected>Nenhuma entidade cadastrada!</option>';
                return;
            }

            entidades.forEach(entidade => {
                const option = document.createElement('option');
                option.value = entidade.id;
                option.textContent = `${entidade.razao_social} (${entidade.nome_fantasia})`;
                origemSelect.appendChild(option.cloneNode(true));
                destinoSelect.appendChild(option.cloneNode(true));
            });
        } catch (error) {
            console.error('Erro ao popular dropdowns de entidades:', error);
            origemSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar lista.</option>';
            destinoSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar lista.</option>';
        }
    }

    if (formPedido) {
        popularDropdownEntidades();

        formPedido.addEventListener('submit', async (event) => {
            event.preventDefault();

            const msgRetorno = document.getElementById('mensagem-retorno-pedido');
            msgRetorno.textContent = 'Enviando Pedido...';
            msgRetorno.style.color = '#396FBA';

            const formData = new FormData(formPedido);
            const data = Object.fromEntries(formData.entries());

            data.peso = parseFloat(data.peso);
            data.valor_frete = parseFloat(data.valor_frete);

            try {
                const response = await fetch('/api/pedidos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    msgRetorno.textContent = result.message || `Pedido ${result.id} cadastrado com sucesso!`;
                    msgRetorno.style.color = 'green';
                    formPedido.reset();
                } else if (response.status === 401) {
                    window.location.href = '/';
                } else {
                    msgRetorno.textContent = result.message || 'Erro desconhecido ao cadastrar pedido.';
                    msgRetorno.style.color = 'red';
                    console.error('Erro de API no Pedido:', result.error);
                }
            } catch (error) {
                console.error('Erro de rede ou cliente no Pedido:', error);
                msgRetorno.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                msgRetorno.style.color = 'red';
            }
        });
    }

    // ------------------------------------------------------------------
    // Listagem de pedidos (listar_pedidos.html)
    // ------------------------------------------------------------------
    const containerListaPedidos = document.getElementById('container-lista-pedidos');
    const mensagemListagem = document.getElementById('mensagem-listagem');

    async function listarPedidos() {
        if (!containerListaPedidos) return;

        mensagemListagem.textContent = 'Buscando dados no servidor...';
        mensagemListagem.style.color = '#396FBA';

        try {
            const response = await fetch('/api/pedidos');
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Falha ao buscar a lista de pedidos.');

            const pedidos = await response.json();
            mensagemListagem.textContent = '';

            if (!Array.isArray(pedidos) || pedidos.length === 0) {
                containerListaPedidos.innerHTML = '<p style="font-weight: bold;">Nenhum pedido de remessa encontrado no sistema.</p>';
                return;
            }

            let tableHTML = `
                <table class="tabela-pedidos">
                    <thead>
                        <tr>
                            <th>Cód. Rastreio</th>
                            <th>Origem</th>
                            <th>Destino</th>
                            <th>Status</th>
                            <th>Entrega Prevista</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            pedidos.forEach(pedido => {
                const dataPrevista = pedido.data_entrega_prevista
                    ? new Date(pedido.data_entrega_prevista).toLocaleDateString('pt-BR')
                    : '—';

                let statusClass = '';
                if (pedido.status === 'ENTREGUE') statusClass = 'status-entregue';
                else if (pedido.status === 'EM_TRANSPORTE') statusClass = 'status-transito';
                else if (pedido.status === 'CANCELADO') statusClass = 'status-cancelado';
                else if (pedido.status === 'PENDENTE') statusClass = 'status-pendente';

                tableHTML += `
                    <tr class="${statusClass}">
                        <td>${pedido.codigo_rastreio}</td>
                        <td>${pedido.nome_origem}</td>
                        <td>${pedido.nome_destino}</td>
                        <td>${pedido.status}</td>
                        <td>${dataPrevista}</td>
                        <td>
                            <div class="dropdown-acoes">
                                <button class="btn-menu-acoes" data-id="${pedido.id}">&#x22EE;</button>
                                <div class="menu-conteudo" id="menu-${pedido.id}">
                                    <a href="#" class="acao-visualizar" data-id="${pedido.id}">Ver Detalhes</a>
                                    <a href="#" class="acao-editar" data-id="${pedido.id}">Editar Pedido</a>
                                    <a href="#" class="acao-excluir" data-id="${pedido.id}">Excluir</a>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            containerListaPedidos.innerHTML = tableHTML;
            anexarListenersAcoesPedidos();
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            mensagemListagem.textContent = 'Erro ao carregar pedidos. Verifique o servidor.';
            mensagemListagem.style.color = 'red';
            containerListaPedidos.innerHTML = '';
        }
    }

    if (containerListaPedidos) {
        listarPedidos();
    }

    // ------------------------------------------------------------------
    // Edição de pedidos (editar_pedido.html)
    // ------------------------------------------------------------------
    const formEdicaoPedido = document.getElementById('form-edicao-pedido');
    const pedidoIdInput = document.getElementById('pedido_id');

    async function carregarDadosPedidoParaEdicao(id) {
        const msgRetorno = document.getElementById('mensagem-retorno-edicao');
        msgRetorno.textContent = 'Carregando dados do pedido...';
        msgRetorno.style.color = '#396FBA';

        try {
            const response = await fetch(`/api/pedidos/${id}`);
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Pedido não encontrado ou erro de busca.');

            const pedido = await response.json();

            document.getElementById('pedido_id').value = pedido.id;
            document.getElementById('pedido-id-display').textContent = `(ID: ${pedido.id})`;
            document.getElementById('codigo_rastreio').value = pedido.codigo_rastreio;

            if (pedido.data_entrega_prevista) {
                document.getElementById('data_entrega_prevista').value = pedido.data_entrega_prevista.split('T')[0];
            }

            document.getElementById('status').value = pedido.status;
            document.getElementById('descricao_carga').value = pedido.descricao_carga || '';
            document.getElementById('peso').value = pedido.peso ?? '';
            document.getElementById('valor_frete').value = pedido.valor_frete ?? '';
            document.getElementById('entidade_origem_id').value = pedido.entidade_origem_id;
            document.getElementById('entidade_destino_id').value = pedido.entidade_destino_id;

            msgRetorno.textContent = 'Dados prontos para edição.';
            msgRetorno.style.color = 'black';
        } catch (error) {
            console.error('Erro ao carregar dados do pedido para edição:', error);
            msgRetorno.textContent = 'Erro ao carregar dados do pedido: ' + error.message;
            msgRetorno.style.color = 'red';
        }
    }

    if (formEdicaoPedido) {
        popularDropdownEntidades().then(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const pedidoId = urlParams.get('id');

            if (pedidoId) {
                carregarDadosPedidoParaEdicao(pedidoId);
            } else {
                const msg = document.getElementById('mensagem-retorno-edicao');
                msg.textContent = 'ID do pedido não fornecido na URL.';
                msg.style.color = 'red';
            }
        });

        formEdicaoPedido.addEventListener('submit', async (event) => {
            event.preventDefault();

            const msgRetorno = document.getElementById('mensagem-retorno-edicao');
            const id = pedidoIdInput.value;

            msgRetorno.textContent = `Atualizando Pedido ${id}...`;
            msgRetorno.style.color = '#396FBA';

            const formData = new FormData(formEdicaoPedido);
            const data = Object.fromEntries(formData.entries());
            data.peso = parseFloat(data.peso);
            data.valor_frete = parseFloat(data.valor_frete);

            try {
                const response = await fetch(`/api/pedidos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    msgRetorno.textContent = result.message || `Pedido ${id} atualizado com sucesso!`;
                    msgRetorno.style.color = 'green';
                } else if (response.status === 401) {
                    window.location.href = '/';
                } else {
                    msgRetorno.textContent = result.message || 'Erro desconhecido ao atualizar pedido.';
                    msgRetorno.style.color = 'red';
                    console.error('Erro de API na Edição:', result.error);
                }
            } catch (error) {
                console.error('Erro de rede ou cliente na Edição:', error);
                msgRetorno.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                msgRetorno.style.color = 'red';
            }
        });
    }

    // ------------------------------------------------------------------
    // Exclusão de pedidos
    // ------------------------------------------------------------------
    async function excluirPedido(id) {
        if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o Pedido ID: ${id}? Esta ação é irreversível!`)) {
            return;
        }

        try {
            const response = await fetch(`/api/pedidos/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 401) { window.location.href = '/'; return; }

            const result = await response.json();

            if (response.ok) {
                alert(result.message || `Pedido ${id} excluído com sucesso!`);
                listarPedidos();
            } else if (response.status === 404) {
                alert(result.message || 'Pedido não encontrado.');
            } else {
                alert(`Falha ao excluir pedido: ${result.message || 'Erro desconhecido.'}`);
                console.error('Erro de API na Exclusão:', result.error);
            }
        } catch (error) {
            console.error('Erro de rede ou cliente na Exclusão:', error);
            alert('Erro de conexão com o servidor. Não foi possível excluir.');
        }
    }

    // ------------------------------------------------------------------
    // Listeners de entidades (dropdown e ações)
    // ------------------------------------------------------------------
    function anexarListenersAcoesEntidades() {
        document.removeEventListener('click', fecharTodosMenus);
        document.addEventListener('click', fecharTodosMenus);

        document.querySelectorAll('.btn-menu-acoes-entidade').forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                const entidadeId = this.getAttribute('data-id');
                const menu = document.getElementById(`menu-entidade-${entidadeId}`);
                fecharTodosMenus(menu);
                menu.classList.toggle('mostra');
            });
        });

        document.querySelectorAll('.acao-visualizar-entidade').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                alert(`Visualização de Entidade (ID: ${id}) será implementada em breve!`);
                fecharTodosMenus();
            });
        });

        document.querySelectorAll('.acao-editar-entidade').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                // Redireciona para a página de edição de entidades
                window.location.href = `../cadastro/editar_entidade.html?id=${id}`;
                fecharTodosMenus();
            });
        });

        document.querySelectorAll('.acao-excluir-entidade').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                fecharTodosMenus();
                excluirEntidade(id);
            });
        });
    }

    // ------------------------------------------------------------------
    // Listagem de entidades (listar_entidades.html)
    // ------------------------------------------------------------------
    const containerListaEntidades = document.getElementById('container-lista-entidades');
    const mensagemListagemEntidades = document.getElementById('mensagem-listagem-entidades');

    async function listarEntidades() {
        if (!containerListaEntidades) return;

        mensagemListagemEntidades.textContent = 'Buscando entidades no servidor...';
        mensagemListagemEntidades.style.color = '#396FBA';

        try {
            const response = await fetch('/api/entidades/detalhes');
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Falha ao buscar a lista de entidades.');

            const entidades = await response.json();
            mensagemListagemEntidades.textContent = '';

            if (!Array.isArray(entidades) || entidades.length === 0) {
                containerListaEntidades.innerHTML = '<p style="font-weight: bold;">Nenhuma entidade cadastrada no sistema.</p>';
                return;
            }

            let tableHTML = `
                <table class="tabela-entidades">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Razão Social</th>
                            <th>Nome Fantasia</th>
                            <th>Tipo</th>
                            <th>CNPJ/CPF</th>
                            <th>Telefone</th>
                            <th>Email</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            entidades.forEach(entidade => {
                const tipoDisplay = entidade.tipo || '—';

                tableHTML += `
                    <tr>
                        <td>${entidade.id}</td>
                        <td>${entidade.razao_social || '—'}</td>
                        <td>${entidade.nome_fantasia || '—'}</td>
                        <td>${tipoDisplay}</td>
                        <td>${entidade.cnpj_cpf || 'N/A'}</td>
                        <td>${entidade.telefone || 'N/A'}</td>
                        <td>${entidade.email || 'N/A'}</td>
                        <td>
                            <div class="dropdown-acoes">
                                <button class="btn-menu-acoes-entidade" data-id="${entidade.id}">&#x22EE;</button>
                                <div class="menu-conteudo" id="menu-entidade-${entidade.id}">
                                    <a href="#" class="acao-visualizar-entidade" data-id="${entidade.id}">Ver Detalhes</a>
                                    <a href="#" class="acao-editar-entidade" data-id="${entidade.id}">Editar Entidade</a>
                                    <a href="#" class="acao-excluir-entidade" data-id="${entidade.id}">Excluir</a>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            containerListaEntidades.innerHTML = tableHTML;
            anexarListenersAcoesEntidades();
        } catch (error) {
            console.error('Erro ao listar entidades:', error);
            mensagemListagemEntidades.textContent = 'Erro ao carregar entidades. Verifique o servidor.';
            mensagemListagemEntidades.style.color = 'red';
            containerListaEntidades.innerHTML = '';
        }
    }

    if (containerListaEntidades) {
        listarEntidades();
    }

    // ------------------------------------------------------------------
    // Exclusão de entidades
    // ------------------------------------------------------------------
    async function excluirEntidade(id) {
        if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente a Entidade ID: ${id}? Esta ação é irreversível!`)) {
            return;
        }

        try {
            const response = await fetch(`/api/entidades/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 401) { window.location.href = '/'; return; }

            const result = await response.json();

            if (response.ok) {
                alert(result.message || `Entidade ${id} excluída com sucesso!`);
                listarEntidades();
            } else if (response.status === 404) {
                alert(result.message || 'Entidade não encontrada.');
            } else {
                alert(`Falha ao excluir entidade: ${result.message || 'Erro desconhecido.'}`);
                console.error('Erro de API na Exclusão:', result.error);
            }
        } catch (error) {
            console.error('Erro de rede ou cliente na Exclusão:', error);
            alert('Erro de conexão com o servidor. Não foi possível excluir.');
        }
    }

    // ------------------------------------------------------------------
    // Edição de entidades (editar_entidade.html)
    // ------------------------------------------------------------------
    const formEdicaoEntidade = document.getElementById('form-edicao-entidade');

    async function carregarDadosEntidadeParaEdicao(id) {
        const msgRetorno = document.getElementById('mensagem-retorno-edicao');
        msgRetorno.textContent = 'Carregando dados da entidade...';
        msgRetorno.style.color = '#396FBA';

        try {
            const response = await fetch(`/api/entidades/${id}`);
            if (response.status === 401) { window.location.href = '/'; return; }
            if (!response.ok) throw new Error('Entidade não encontrada.');

            const entidade = await response.json();

            document.getElementById('entidade-id-display').textContent = `(ID: ${entidade.id})`;
            document.getElementById('nome_fantasia').value = entidade.nome_fantasia || '';
            document.getElementById('razao_social').value = entidade.razao_social || '';
            document.getElementById('tipo').value = entidade.tipo || '';
            document.getElementById('cnpj_cpf').value = entidade.cnpj_cpf || '';
            document.getElementById('endereco').value = entidade.endereco || '';
            document.getElementById('cidade').value = entidade.cidade || '';
            document.getElementById('estado').value = entidade.estado || '';
            document.getElementById('telefone').value = entidade.telefone || '';
            document.getElementById('email').value = entidade.email || '';

            msgRetorno.textContent = 'Dados prontos para edição.';
            msgRetorno.style.color = 'black';
        } catch (error) {
            console.error('Erro ao carregar dados da entidade:', error);
            msgRetorno.textContent = 'Erro ao carregar entidade: ' + error.message;
            msgRetorno.style.color = 'red';
        }
    }

    if (formEdicaoEntidade) {
        const urlParams = new URLSearchParams(window.location.search);
        const entidadeId = urlParams.get('id');

        if (entidadeId) {
            carregarDadosEntidadeParaEdicao(entidadeId);
        } else {
            const msg = document.getElementById('mensagem-retorno-edicao');
            msg.textContent = 'ID da entidade não fornecido na URL.';
            msg.style.color = 'red';
        }

        formEdicaoEntidade.addEventListener('submit', async (event) => {
            event.preventDefault();

            const urlParams = new URLSearchParams(window.location.search);
            const entidadeId = urlParams.get('id');

            const msgRetorno = document.getElementById('mensagem-retorno-edicao');
            msgRetorno.textContent = 'Atualizando entidade...';
            msgRetorno.style.color = '#396FBA';

            const formData = new FormData(formEdicaoEntidade);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`/api/entidades/${entidadeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    msgRetorno.textContent = result.message || `Entidade ${entidadeId} atualizada com sucesso!`;
                    msgRetorno.style.color = 'green';
                } else if (response.status === 401) {
                    window.location.href = '/';
                } else {
                    msgRetorno.textContent = result.message || 'Erro ao atualizar entidade.';
                    msgRetorno.style.color = 'red';
                    console.error('Erro de API na Edição Entidade:', result.error);
                }
            } catch (error) {
                console.error('Erro de rede ou cliente na Edição Entidade:', error);
                msgRetorno.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                msgRetorno.style.color = 'red';
            }
        });
    }

});
