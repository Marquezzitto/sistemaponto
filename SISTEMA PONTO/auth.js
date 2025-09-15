// Módulo de Autenticação e Usuários
import { mostrarMensagem, inicializarComponentes } from './core.js';

function inicializarAdmin() {
    const usuariosExistentes = localStorage.getItem('usuarios');
    if (!usuariosExistentes) {
        const usuariosPadrao = [{
            nome: 'Marcos Sodré',
            cpf: '12345678900',
            email: 'marcos.sodre@brinks.com.br',
            cargo: 'Administrador',
            senha: 'admin'
        }];
        localStorage.setItem('usuarios', JSON.stringify(usuariosPadrao));
    }
}

function verificarLogin() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        mostrarMensagem("Você precisa estar logado para acessar esta página.");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return false; 
    }
    return true; 
}

function verificarPermissaoAdmin() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuarioLogado.cargo !== 'Administrador') {
        mostrarMensagem("Você não tem permissão para acessar esta página.");
        window.location.href = 'dashboard.html';
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    mostrarMensagem("Você foi desconectado.");
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarComponentes();
    inicializarAdmin();
    
    const paginaAtual = document.title;
    const paginasProtegidas = ["Dashboard", "Bater Ponto", "Relatório", "Configurações", "Cadastro de Pessoas", "Cadastro de Usuário"]; 
    const paginasAdmin = ["Cadastro de Pessoas", "Cadastro de Usuário"];

    if (paginasProtegidas.includes(paginaAtual)) {
        if (!verificarLogin()) {
            return; 
        }
    }
    if(paginasAdmin.includes(paginaAtual)){
        verificarPermissaoAdmin();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const cpfOuEmail = document.getElementById('cpf').value;
            const senha = document.getElementById('senha').value;
            const usuarioAutenticado = usuarios.find(user => 
                (user.cpf === cpfOuEmail || user.email === cpfOuEmail) && user.senha === senha
            );
            if (usuarioAutenticado) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAutenticado));
                mostrarMensagem('Login bem-sucedido!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                mostrarMensagem('CPF/E-mail ou senha incorretos.');
            }
        });
    }

    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value;
            const email = document.getElementById('email').value;
            const cargo = document.getElementById('cargo').value;
            const senha = document.getElementById('senha').value;
            const novoUsuario = { nome, cpf, email, cargo, senha };
            
            const usuarioExistente = usuarios.find(u => u.cpf === cpf || u.email === email);
            if(usuarioExistente) {
                mostrarMensagem('Erro: CPF ou E-mail já cadastrado.');
                return;
            }

            usuarios.push(novoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            mostrarMensagem('Usuário cadastrado com sucesso!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    }

    if (document.title === "Configurações") {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        // Popula o formulário de informações pessoais com os dados do usuário logado
        if (usuarioLogado) {
            document.getElementById('nome').value = usuarioLogado.nome;
            document.getElementById('cpf').value = usuarioLogado.cpf; // Carrega o CPF
            document.getElementById('email').value = usuarioLogado.email;
            document.getElementById('cargo').value = usuarioLogado.cargo;
        }

        // Lógica para salvar as informações pessoais (formulário do topo)
        const infoForm = document.getElementById('infoForm');
        infoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nome = document.getElementById('nome').value;
            const cpf = document.getElementById('cpf').value;
            const email = document.getElementById('email').value;
            const cargo = document.getElementById('cargo').value;
            
            let usuarios = JSON.parse(localStorage.getItem('usuarios'));
            let usuarioLogadoOriginal = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            // Usamos o CPF original para encontrar o usuário, pois o e-mail/CPF pode ter sido alterado
            const usuarioIndex = usuarios.findIndex(u => u.cpf === usuarioLogadoOriginal.cpf);

            if (usuarioIndex !== -1) {
                usuarios[usuarioIndex].nome = nome;
                usuarios[usuarioIndex].cpf = cpf;
                usuarios[usuarioIndex].email = email;
                usuarios[usuarioIndex].cargo = cargo;

                // Salva a lista de usuários atualizada
                localStorage.setItem('usuarios', JSON.stringify(usuarios));
                
                // Atualiza também os dados do usuário logado na sessão atual
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarios[usuarioIndex]));

                mostrarMensagem('Informações atualizadas com sucesso!');
            }
        });

        // Lógica para o formulário de atualização de senha
        const senhaForm = document.getElementById('senhaForm');
        senhaForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const novaSenha = document.getElementById('novaSenha').value;
            const confirmarSenha = document.getElementById('confirmarSenha').value;
            
            if (novaSenha !== confirmarSenha) {
                mostrarMensagem('As senhas não coincidem!');
                return;
            }

            let usuarios = JSON.parse(localStorage.getItem('usuarios'));
            let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            const usuarioIndex = usuarios.findIndex(u => u.cpf === usuarioLogado.cpf);
            if (usuarioIndex !== -1) {
                usuarios[usuarioIndex].senha = novaSenha;
                localStorage.setItem('usuarios', JSON.stringify(usuarios));
                mostrarMensagem('Senha atualizada com sucesso!');
            }
        });

        // =======================================================
        // LÓGICA DE GERENCIAMENTO DE OUTROS USUÁRIOS (SÓ PARA ADMINS)
        // =======================================================
        if (usuarioLogado && usuarioLogado.cargo === 'Administrador') {
            const adminSection = document.getElementById('admin-management-section');
            const userSelect = document.getElementById('select-colaborador');
            const editForm = document.getElementById('editUserForm');
            
            const editNome = document.getElementById('edit-nome');
            const editCpf = document.getElementById('edit-cpf');
            const editEmail = document.getElementById('edit-email');
            const editCargo = document.getElementById('edit-cargo');
            const originalCpfInput = document.getElementById('edit-user-original-cpf');

            const resetSenhaInput = document.getElementById('reset-senha');
            const btnResetSenha = document.getElementById('btn-reset-senha');
            const btnExcluirUsuario = document.getElementById('btn-excluir-usuario');

            adminSection.style.display = 'block';

            const popularDropdown = () => {
                const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                userSelect.innerHTML = '<option value="">-- Selecione --</option>';
                usuarios.forEach(user => {
                    if (user.cpf !== usuarioLogado.cpf) {
                        const option = document.createElement('option');
                        option.value = user.cpf;
                        option.textContent = user.nome;
                        userSelect.appendChild(option);
                    }
                });
            };

            userSelect.addEventListener('change', () => {
                const selectedCpf = userSelect.value;
                if (!selectedCpf) {
                    editForm.reset();
                    originalCpfInput.value = '';
                    return;
                }
                const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                const selectedUser = usuarios.find(u => u.cpf === selectedCpf);
                if (selectedUser) {
                    editNome.value = selectedUser.nome;
                    editCpf.value = selectedUser.cpf;
                    editEmail.value = selectedUser.email;
                    editCargo.value = selectedUser.cargo;
                    originalCpfInput.value = selectedUser.cpf;
                }
            });

            editForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const originalCpf = originalCpfInput.value;
                if (!originalCpf) {
                    mostrarMensagem("Por favor, selecione um colaborador.");
                    return;
                }

                let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                const userIndex = usuarios.findIndex(u => u.cpf === originalCpf);

                if (userIndex !== -1) {
                    usuarios[userIndex].nome = editNome.value;
                    usuarios[userIndex].cpf = editCpf.value;
                    usuarios[userIndex].email = editEmail.value;
                    usuarios[userIndex].cargo = editCargo.value;
                    
                    localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    mostrarMensagem("Dados do colaborador atualizados com sucesso!");
                    popularDropdown();
                    editForm.reset();
                }
            });

            btnResetSenha.addEventListener('click', () => {
                const originalCpf = originalCpfInput.value;
                const novaSenha = resetSenhaInput.value;
                if (!originalCpf) {
                    mostrarMensagem("Por favor, selecione um colaborador."); return;
                }
                if (!novaSenha) {
                    mostrarMensagem("Por favor, digite a nova senha."); return;
                }
                
                let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                const userIndex = usuarios.findIndex(u => u.cpf === originalCpf);
                
                if (userIndex !== -1) {
                    usuarios[userIndex].senha = novaSenha;
                    localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    mostrarMensagem("Senha do colaborador redefinida com sucesso!");
                    resetSenhaInput.value = '';
                }
            });

            btnExcluirUsuario.addEventListener('click', () => {
                const originalCpf = originalCpfInput.value;
                if (!originalCpf) {
                    mostrarMensagem("Por favor, selecione um colaborador."); return;
                }
                
                if (confirm(`Tem certeza que deseja excluir permanentemente o colaborador ${editNome.value}? Esta ação não pode ser desfeita.`)) {
                    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
                    const usuariosAtualizados = usuarios.filter(u => u.cpf !== originalCpf);
                    localStorage.setItem('usuarios', JSON.stringify(usuariosAtualizados));
                    mostrarMensagem("Colaborador excluído com sucesso!");
                    popularDropdown();
                    editForm.reset();
                }
            });

            popularDropdown();
        }
    }
});