// core.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where, Timestamp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

function mostrarMensagem(mensagem) {
    const modal = document.getElementById("avisoModal");
    const modalMensagem = document.getElementById("modalMensagem");
    const closeBtn = document.querySelector("#avisoModal .close-button");
    if (!modal || !modalMensagem) return;
    modalMensagem.textContent = mensagem;
    modal.style.display = "block";
    closeBtn.onclick = function() { modal.style.display = "none"; }
    window.onclick = function(event) { if (event.target == modal) modal.style.display = "none"; }
}

function abrirModalEdicao(docId, tipo, horario) {
    const modal = document.getElementById("edicaoModal");
    const closeBtn = modal.querySelector(".close-button");
    const form = document.getElementById("formEdicaoPonto");
    if (!modal || !form) return;
    const dataObj = new Date(horario);
    const dataString = dataObj.toISOString().split('T')[0];
    const horarioString = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const tipoSelect = form.querySelector("#edicaoTipo");
    tipoSelect.innerHTML = `<option value="${tipo}">${tipo}</option>`;
    tipoSelect.disabled = true;
    form.querySelector("#edicaoData").value = dataString;
    form.querySelector("#edicaoHorario").value = horarioString;
    form.querySelector("#edicaoIndex").value = docId;
    modal.style.display = "block";
    const fecharModal = () => {
        modal.style.display = "none";
        tipoSelect.disabled = false;
    };
    closeBtn.onclick = fecharModal;
    window.onclick = function(event) { if (event.target == modal) fecharModal(); }
}

function inicializarComponentes() {
    const elementoHora = document.getElementById("horaAtual");
    if (elementoHora) {
        const atualizar = () => elementoHora.textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
        atualizar();
        setInterval(atualizar, 1000);
    }
}

async function carregarRegistros(tabelaId, filtro = {}) {
    const tabela = document.querySelector(`#${tabelaId} tbody`);
    if (!tabela) return;
    tabela.innerHTML = "<tr><td colspan='6'>Carregando registros...</td></tr>";

    try {
        let constraints = [orderBy("horario", "desc")];
        if (filtro.emailUsuario && filtro.emailUsuario !== 'todos') {
            constraints.push(where("emailUsuario", "==", filtro.emailUsuario));
        }
        if (filtro.mes !== undefined && filtro.ano !== undefined) {
            const inicioDoMes = Timestamp.fromDate(new Date(filtro.ano, filtro.mes, 1));
            const fimDoMes = Timestamp.fromDate(new Date(filtro.ano, filtro.mes + 1, 0, 23, 59, 59));
            constraints.push(where("horario", ">=", inicioDoMes));
            constraints.push(where("horario", "<=", fimDoMes));
        }

        const q = query(collection(db, "registrosPonto"), ...constraints);
        const querySnapshot = await getDocs(q);

        const registros = [];
        querySnapshot.forEach((doc) => {
            registros.push({ id: doc.id, ...doc.data() });
        });
        
        // ==================================================================
        // CORREÇÃO: As chamadas de cálculo agora estão aqui para garantir a sincronia
        // ==================================================================
        if (document.title === "Dashboard") {
            window.calcularHorasDoDia(registros);
        }
        if (document.title === "Relatório" || document.title === "Relatórios") {
            window.calcularHorasDoMes(registros);
        }

        const registrosAgrupadosPorDia = {};
        registros.forEach((reg) => {
            if (reg.horario && reg.horario.toDate) {
                const data = reg.horario.toDate().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                if (!registrosAgrupadosPorDia[data]) registrosAgrupadosPorDia[data] = {};
                registrosAgrupadosPorDia[data][reg.tipo] = { horario: reg.horario.toDate(), id: reg.id };
            }
        });

        tabela.innerHTML = "";
        let dadosExibidos = Object.keys(registrosAgrupadosPorDia).sort((a,b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-')));
        
        if (document.title === "Dashboard" && filtro.limite) {
            dadosExibidos = dadosExibidos.slice(0, filtro.limite);
        }
        if (document.title === "Bater Ponto") {
            const hoje = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            dadosExibidos = dadosExibidos.filter(data => data === hoje);
        }

        if (dadosExibidos.length === 0) {
            tabela.innerHTML = "<tr><td colspan='6'>Nenhum registro encontrado.</td></tr>";
            return;
        }

        dadosExibidos.forEach(data => {
            const registrosDoDia = registrosAgrupadosPorDia[data];
            const hoje = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const podeEditarOuExcluir = data === hoje;
            const criarCelulaTempo = (tipo) => {
                const registro = registrosDoDia[tipo];
                if (!registro) return '<td>-</td>';
                const horarioFormatado = registro.horario.toLocaleTimeString('pt-BR', { hour12: false });
                const botaoEditar = podeEditarOuExcluir ? 
                    ` <button class="btn-editar" onclick="editarMarcacao('${registro.id}', '${tipo}', '${registro.horario.toISOString()}')">✏️</button>` : '';
                return `<td>${horarioFormatado}${botaoEditar}</td>`;
            };
            const botaoExcluirDia = podeEditarOuExcluir ? 
                `<button class="btn-excluir" onclick="excluirDia('${data}')">❌</button>` : '';
            const linha = `
                <tr>
                    <td>${data}</td>
                    ${criarCelulaTempo('Entrada')}
                    ${criarCelulaTempo('Início Intervalo')}
                    ${criarCelulaTempo('Fim Intervalo')}
                    ${criarCelulaTempo('Saída')}
                    <td>${botaoExcluirDia}</td>
                </tr>
            `;
            tabela.innerHTML += linha;
        });

    } catch (error) {
        console.error("Erro ao carregar registros: ", error);
        tabela.innerHTML = "<tr><td colspan='6'>Erro ao carregar registros. Verifique o console.</td></tr>";
    }
}

export { mostrarMensagem, carregarRegistros, abrirModalEdicao, inicializarComponentes };