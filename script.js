// // Função para inicializar o banco de dados local com o usuário administrador
// function inicializarAdmin() {
//     const usuariosExistentes = localStorage.getItem('usuarios');
//     if (!usuariosExistentes) {
//         const usuariosPadrao = [{
//             nome: 'Marcos Sodré',
//             cpf: '12345678900', // Exemplo de CPF
//             email: 'marcos.sodre@brinks.com.br',
//             cargo: 'Administrador',
//             senha: 'admin' // Senha de exemplo. Use uma senha forte em um ambiente real.
//         }];
//         localStorage.setItem('usuarios', JSON.stringify(usuariosPadrao));
//     }
// }

// // Chama a função de inicialização logo que o script é carregado
// inicializarAdmin();

// // Funções globais para serem usadas em várias páginas
// function atualizarHora() {
//     const agora = new Date();
//     const elementoHora = document.getElementById("horaAtual");
//     if (elementoHora) {
//         elementoHora.textContent = agora.toLocaleString();
//     }
// }

// function carregarRegistros(tabelaId, limite) {
//     const registros = JSON.parse(localStorage.getItem("registrosPonto")) || [];
//     const tabela = document.querySelector(`#${tabelaId} tbody`);
//     if (tabela) {
//         tabela.innerHTML = "";
//         let dadosExibidos = [...registros].reverse();
//         if (limite) {
//             dadosExibidos = dadosExibidos.slice(0, limite);
//         }

//         const isDeletablePage = document.title === "Relatórios" || document.title === "Dashboard";

//         dadosExibidos.forEach((reg, index) => {
//             const indiceOriginal = registros.length - 1 - (registros.length - dadosExibidos.length + index);
//             const linha = `
//                 <tr>
//                     <td>${reg.tipo}</td>
//                     <td>${reg.horario}</td>
//                     ${isDeletablePage ? `<td><button class="btn-excluir" onclick="excluirMarcacao(${indiceOriginal})">❌</button></td>` : ''}
//                 </tr>
//             `;
//             tabela.innerHTML += linha;
//         });
//     }
// }

// function excluirMarcacao(index) {
//     if (confirm("Tem certeza que deseja excluir esta marcação?")) {
//         let registros = JSON.parse(localStorage.getItem("registrosPonto")) || [];
//         registros.splice(index, 1);
//         localStorage.setItem("registrosPonto", JSON.stringify(registros));
        
//         if (document.title === "Relatórios") {
//             carregarRegistros("tabelaHistorico");
//         }
//         if (document.title === "Dashboard") {
//             carregarRegistros("tabelaRecentes", 5);
//         }
//         alert("Marcação excluída com sucesso!");
//     }
// }

// function registrar(tipo) {
//     const hora = new Date().toLocaleTimeString();
//     const registros = JSON.parse(localStorage.getItem("registrosPonto")) || [];
//     registros.push({ tipo: tipo, horario: hora });
//     localStorage.setItem("registrosPonto", JSON.stringify(registros));
//     alert('Ponto registrado com sucesso!');
//     if (document.title === "Bater Ponto") {
//         carregarRegistros("tabelaPonto", 1);
//     }
// }

// // NOVA FUNÇÃO: VERIFICA PERMISSÃO PARA ACESSAR PÁGINAS ESPECÍFICAS
// function verificarPermissao(pagina) {
//     const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
//     // Se o usuário não estiver logado, redireciona
//     if (!usuarioLogado) {
//         alert("Você precisa estar logado para acessar esta página.");
//         window.location.href = 'index.html';
//         return;
//     }

//     // Lógica para páginas com acesso restrito
//     if (pagina === 'cadastro.html' && usuarioLogado.email !== 'marcos.sodre@brinks.com.br') {
//         alert("Você não tem permissão para acessar a página de cadastro.");
//         window.location.href = 'dashboard.html';
//     }
// }

// // NOVA FUNÇÃO: FAZ LOGOUT DO USUÁRIO
// function logout() {
//     localStorage.removeItem('usuarioLogado');
//     alert("Você foi desconectado.");
//     window.location.href = 'index.html';
// }

// // Inicializa as funções
// document.addEventListener('DOMContentLoaded', () => {
//     const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
//     const loginForm = document.getElementById('loginForm');
//     if (loginForm) {
//         loginForm.addEventListener('submit', (event) => {
//             event.preventDefault();
//             const cpfOuEmail = document.getElementById('cpf').value;
//             const senha = document.getElementById('senha').value;
//             const usuarioAutenticado = usuarios.find(user => 
//                 (user.cpf === cpfOuEmail || user.email === cpfOuEmail) && user.senha === senha
//             );
//             if (usuarioAutenticado) {
//                 localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAutenticado));
//                 alert('Login bem-sucedido!');
//                 window.location.href = 'dashboard.html';
//             } else {
//                 alert('CPF/E-mail ou senha incorretos.');
//             }
//         });
//     }

//     const cadastroForm = document.getElementById('cadastroForm');
//     if (cadastroForm) {
//         verificarPermissao('cadastro.html');
//         cadastroForm.addEventListener('submit', (event) => {
//             event.preventDefault();
//             const nome = document.getElementById('nome').value;
//             const cpf = document.getElementById('cpf').value;
//             const email = document.getElementById('email').value;
//             const cargo = document.getElementById('cargo').value;
//             const senha = document.getElementById('senha').value;
//             const novoUsuario = { nome, cpf, email, cargo, senha };
//             usuarios.push(novoUsuario);
//             localStorage.setItem('usuarios', JSON.stringify(usuarios));
//             alert('Usuário cadastrado com sucesso!');
//             window.location.href = 'index.html';
//         });
//     }

//     setInterval(atualizarHora, 1000);
//     atualizarHora();

//     if (document.title === "Dash board") {
//         carregarRegistros("tabelaRecentes", 5);
//     }

//     if (document.title === "Relatórios") {
//         carregarRegistros("tabelaHistorico");
//     }

//     if (document.title === "Bater Ponto") {
//         carregarRegistros("tabelaPonto", 1);
//     }
// });