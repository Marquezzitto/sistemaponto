import { mostrarMensagem, carregarRegistros, abrirModalEdicao, inicializarComponentes } from './core.js';
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, deleteDoc, updateDoc, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

// =======================================================
// Funções Auxiliares
// =======================================================
function formatarHorasDecimais(horasDecimais) {
    if (isNaN(horasDecimais) || horasDecimais < 0) {
        return '0h 00m';
    }
    const horas = Math.floor(horasDecimais);
    const fracaoDeHora = horasDecimais - horas;
    const minutos = Math.round(fracaoDeHora * 60);
    const minutosFormatados = String(minutos).padStart(2, '0');
    return `${horas}h ${minutosFormatados}m`;
}

function calcularHorasDoDia(registrosDoBanco) {
    const totalTrabalhadoEl = document.getElementById('totalTrabalhado');
    if (!totalTrabalhadoEl) return;
    const duracaoAlmocoEl = document.getElementById('duracaoAlmoco');
    const horasExtraEl = document.getElementById('horasExtra');
    const hojeStr = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const registrosHoje = registrosDoBanco.filter(reg =>
        reg.horario && reg.horario.toDate &&
        reg.horario.toDate().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }) === hojeStr
    );
    const entrada = registrosHoje.find(r => r.tipo === 'Entrada')?.horario.toDate();
    const inicioIntervalo = registrosHoje.find(r => r.tipo === 'Início Intervalo')?.horario.toDate();
    const fimIntervalo = registrosHoje.find(r => r.tipo === 'Fim Intervalo')?.horario.toDate();
    const saida = registrosHoje.find(r => r.tipo === 'Saída')?.horario.toDate();
    let totalTrabalhadoEmHoras = 0;
    let duracaoAlmocoEmMinutos = 0;
    let horasExtraEmHoras = 0;
    if (entrada && saida) {
        let tempoAlmocoEmMs = 0;
        if (inicioIntervalo && fimIntervalo) {
            tempoAlmocoEmMs = fimIntervalo.getTime() - inicioIntervalo.getTime();
        }
        duracaoAlmocoEmMinutos = tempoAlmocoEmMs / (1000 * 60);
        const tempoBrutoEmMs = saida.getTime() - entrada.getTime();
        const tempoLiquidoEmMs = tempoBrutoEmMs - tempoAlmocoEmMs;
        totalTrabalhadoEmHoras = Math.max(0, tempoLiquidoEmMs / (1000 * 60 * 60));
        const jornadaPadraoEmHoras = 8 + (48 / 60);
        if (totalTrabalhadoEmHoras > jornadaPadraoEmHoras) {
            horasExtraEmHoras = totalTrabalhadoEmHoras - jornadaPadraoEmHoras;
        }
    }
    totalTrabalhadoEl.textContent = formatarHorasDecimais(totalTrabalhadoEmHoras);
    duracaoAlmocoEl.textContent = `${Math.round(duracaoAlmocoEmMinutos)} minutos`;
    horasExtraEl.textContent = formatarHorasDecimais(horasExtraEmHoras);
}

function calcularHorasDoMes(registros) {
    const horasMesEl = document.getElementById('horasMes');
    const horasExtrasMesEl = document.getElementById('horasExtrasMes');
    const avisosSextaHoraEl = document.getElementById('avisosSextaHora');
    if (!horasMesEl) return;
    let totalMesEmMilissegundos = 0;
    let totalHorasExtrasMes = 0;
    let avisosSextaHoraMes = 0;
    const registrosAgrupados = {};
    registros.forEach(reg => {
        if(reg.horario && reg.horario.toDate) {
            const data = reg.horario.toDate().toLocaleDateString('pt-BR', {year: 'numeric', month: '2-digit', day: '2-digit'});
            const email = reg.emailUsuario;
            const chave = `${data}_${email}`;
            if (!registrosAgrupados[chave]) registrosAgrupados[chave] = [];
            registrosAgrupados[chave].push(reg);
        }
    });
    for (const chave in registrosAgrupados) {
        const registrosDoDia = registrosAgrupados[chave];
        const entrada = registrosDoDia.find(r => r.tipo === 'Entrada')?.horario.toDate();
        const saida = registrosDoDia.find(r => r.tipo === 'Saída')?.horario.toDate();
        const inicioIntervalo = registrosDoDia.find(r => r.tipo === 'Início Intervalo')?.horario.toDate();
        const fimIntervalo = registrosDoDia.find(r => r.tipo === 'Fim Intervalo')?.horario.toDate();
        if (entrada && saida) {
            let tempoAlmocoEmMs = 0;
            if (inicioIntervalo && fimIntervalo) {
                tempoAlmocoEmMs = fimIntervalo.getTime() - inicioIntervalo.getTime();
            }
            const tempoBrutoEmMs = saida.getTime() - entrada.getTime();
            const tempoLiquidoEmMs = Math.max(0, tempoBrutoEmMs - tempoAlmocoEmMs);
            totalMesEmMilissegundos += tempoLiquidoEmMs;
            const totalTrabalhadoNoDiaHoras = tempoLiquidoEmMs / (1000 * 60 * 60);
            const jornadaPadrao = 8 + (48 / 60);
            if (totalTrabalhadoNoDiaHoras > jornadaPadrao) {
                totalHorasExtrasMes += (totalTrabalhadoNoDiaHoras - jornadaPadrao);
            }
        }
        if (entrada && inicioIntervalo) {
            const horasAntesDoIntervalo = (inicioIntervalo.getTime() - entrada.getTime()) / (1000 * 60 * 60);
            if (horasAntesDoIntervalo > 6) {
                avisosSextaHoraMes++;
            }
        }
    }
    const totalHorasMes = totalMesEmMilissegundos / (1000 * 60 * 60);
    horasMesEl.textContent = formatarHorasDecimais(totalHorasMes);
    horasExtrasMesEl.textContent = formatarHorasDecimais(totalHorasExtrasMes);
    avisosSextaHoraEl.textContent = `${avisosSextaHoraMes}`;
}

async function verificarAvisos() {
    const agora = new Date();
    const avisoAlmocoEl = document.getElementById('avisoAlmoco');
    const avisoSaidaEl = document.getElementById('avisoSaida');
    if (!avisoAlmocoEl) return;
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) return;
    const inicioDeHoje = new Date();
    inicioDeHoje.setHours(0, 0, 0, 0);
    const q = query(collection(db, "registrosPonto"), where("emailUsuario", "==", usuarioLogado.email), where("horario", ">=", inicioDeHoje), orderBy("horario", "asc"));
    const querySnapshot = await getDocs(q);
    const registrosHoje = [];
    querySnapshot.forEach(doc => registrosHoje.push(doc.data()));
    const entradaHoje = registrosHoje.find(reg => reg.tipo === 'Entrada');
    const inicioIntervaloHoje = registrosHoje.find(reg => reg.tipo === 'Início Intervalo');
    const temSaida = registrosHoje.some(reg => reg.tipo === 'Saída');
    if (entradaHoje && !inicioIntervaloHoje) {
        const entradaHora = entradaHoje.horario.toDate();
        const limiteSextaHora = entradaHora.getTime() + 6 * 60 * 60 * 1000;
        const minutosRestantes = (limiteSextaHora - agora.getTime()) / (1000 * 60);
        if (minutosRestantes <= 0) {
            avisoAlmocoEl.textContent = 'Atenção: O seu limite de 6 horas de trabalho antes do intervalo foi ultrapassado!';
            avisoAlmocoEl.style.color = '#e74c3c';
        } else if (minutosRestantes <= 60) {
            avisoAlmocoEl.textContent = `Atenção: Faltam ${minutosRestantes.toFixed(0)} minutos para o seu horário de almoço (6ª hora).`;
            avisoAlmocoEl.style.color = '#e67e22';
        } else {
            avisoAlmocoEl.textContent = '';
        }
    } else {
        avisoAlmocoEl.textContent = '';
    }
    if (entradaHoje && !temSaida) {
        const entradaHora = entradaHoje.horario.toDate();
        const duracaoTotalMinutos = (8 * 60) + 48 + 60;
        const saidaPrevistaTime = entradaHora.getTime() + duracaoTotalMinutos * 60 * 1000;
        const minutosParaSair = (saidaPrevistaTime - agora.getTime()) / (1000 * 60);
        if (minutosParaSair < 0) {
            const minutosExtras = Math.abs(minutosParaSair);
            avisoSaidaEl.textContent = `Atenção: Você está fazendo hora extra há ${minutosExtras.toFixed(0)} minutos.`;
            avisoSaidaEl.style.color = '#e74c3c';
        } else if (minutosParaSair <= 10) {
            avisoSaidaEl.textContent = `Atenção: Faltam ${minutosParaSair.toFixed(0)} minutos para o seu horário de saída.`;
            avisoSaidaEl.style.color = '#e67e22';
        } else {
            avisoSaidaEl.textContent = '';
        }
    } else {
        avisoSaidaEl.textContent = '';
    }
}

// =======================================================
// Funções de Interação com o Firestore
// =======================================================
async function registrar(tipo) {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    try {
        const novoRegistro = { tipo: tipo, horario: serverTimestamp(), emailUsuario: usuarioLogado.email };
        await addDoc(collection(db, "registrosPonto"), novoRegistro);
        mostrarMensagem('Ponto registrado com sucesso na nuvem!');
        if (document.title === "Bater Ponto") carregarRegistros("tabelaPonto", { emailUsuario: usuarioLogado.email });
        if (document.title === "Dashboard") carregarRegistros("tabelaRecentes", { limite: 5, emailUsuario: usuarioLogado.email });
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        mostrarMensagem('Ocorreu um erro ao salvar o ponto. Tente novamente.');
    }
}

async function excluirDia(dataParaExcluir) {
    if (confirm(`Tem certeza que deseja excluir TODOS os registros do dia ${dataParaExcluir}?`)) {
        try {
            const partesData = dataParaExcluir.split('/');
            const inicioDoDia = new Date(partesData[2], partesData[1] - 1, partesData[0]);
            const fimDoDia = new Date(inicioDoDia.getTime() + 24 * 60 * 60 * 1000 - 1);
            const q = query(collection(db, "registrosPonto"), where("horario", ">=", inicioDoDia), where("horario", "<=", fimDoDia));
            const querySnapshot = await getDocs(q);
            const promessasDeExclusao = [];
            querySnapshot.forEach((documento) => {
                promessasDeExclusao.push(deleteDoc(doc(db, "registrosPonto", documento.id)));
            });
            await Promise.all(promessasDeExclusao);
            mostrarMensagem("Registros do dia excluídos com sucesso!");
            if (document.title === "Relatório" || document.title === "Relatórios") document.getElementById('filtroMes').dispatchEvent(new Event('change'));
        } catch (error) {
            console.error("Erro ao excluir registros do dia: ", error);
            mostrarMensagem("Ocorreu um erro ao excluir os registros.");
        }
    }
}

function editarMarcacao(docId, tipo, horario) {
    abrirModalEdicao(docId, tipo, horario);
}

async function salvarEdicao() {
    const modal = document.getElementById("edicaoModal");
    const form = document.getElementById("formEdicaoPonto");
    const docId = form.querySelector("#edicaoIndex").value;
    const novaDataStr = form.querySelector("#edicaoData").value;
    const novoHorarioStr = form.querySelector("#edicaoHorario").value;
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    try {
        const docRef = doc(db, "registrosPonto", docId);
        const novoHorario = new Date(`${novaDataStr}T${novoHorarioStr}`);
        await updateDoc(docRef, { horario: Timestamp.fromDate(novoHorario) });
        mostrarMensagem("Ponto editado com sucesso!");
        form.querySelector("#edicaoTipo").disabled = false;
        modal.style.display = "none";
        if (document.title === "Relatório" || document.title === "Relatórios") document.getElementById('filtroMes').dispatchEvent(new Event('change'));
        if (document.title === "Dashboard") carregarRegistros("tabelaRecentes", { limite: 5, emailUsuario: usuarioLogado.email });
    } catch (error) {
        console.error("Erro ao salvar edição: ", error);
        mostrarMensagem("Ocorreu um erro ao salvar a edição.");
    }
}

// =======================================================
// Função para Gerar PDF
// =======================================================
function gerarPDF() {
    const element = document.getElementById('conteudoRelatorio');
    const filtroMesEl = document.getElementById('filtroMes');
    const filtroColaboradorEl = document.getElementById('filtroColaborador');
    const mesSelecionado = filtroMesEl.options[filtroMesEl.selectedIndex].text.replace(' de ', '-');
    let nomeArquivo = `Relatorio_Ponto_${mesSelecionado}.pdf`;
    if (filtroColaboradorEl && filtroColaboradorEl.value && filtroColaboradorEl.value !== 'todos') {
        const colaboradorSelecionado = filtroColaboradorEl.options[filtroColaboradorEl.selectedIndex].text;
        nomeArquivo = `Relatorio_Ponto_${colaboradorSelecionado}_${mesSelecionado}.pdf`;
    }
    const opt = {
      margin:       1,
      filename:     nomeArquivo,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const tituloRelatorio = document.createElement('h2');
    tituloRelatorio.innerText = 'Relatório de Ponto';
    tituloRelatorio.style.textAlign = 'center';
    tituloRelatorio.style.marginBottom = '20px';
    element.prepend(tituloRelatorio);
    html2pdf().from(element).set(opt).save().then(() => {
        tituloRelatorio.remove();
    });
}

// =======================================================
// Listeners e Inicialização
// =======================================================
window.registrar = registrar;
window.editarMarcacao = editarMarcacao;
window.excluirDia = excluirDia;
window.calcularHorasDoMes = calcularHorasDoMes;
window.calcularHorasDoDia = calcularHorasDoDia;

document.addEventListener('DOMContentLoaded', () => {
    inicializarComponentes();
    const formEdicao = document.getElementById('formEdicaoPonto');
    if(formEdicao) {
        const salvarBtn = formEdicao.querySelector('button[type="button"]');
        if (salvarBtn) salvarBtn.addEventListener('click', salvarEdicao);
    }
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) return;
    if (document.title === "Dashboard") {
        carregarRegistros("tabelaRecentes", { limite: 5, emailUsuario: usuarioLogado.email });
        setInterval(verificarAvisos, 60000); 
        verificarAvisos();
    }
    if (document.title === "Relatório" || document.title === "Relatórios") {
        const adminFiltroContainer = document.getElementById('adminFiltroContainer');
        const filtroColaboradorEl = document.getElementById('filtroColaborador');
        const filtroMesEl = document.getElementById('filtroMes');
        const carregarRelatorio = () => {
            const [ano, mes] = filtroMesEl.value.split('-').map(Number);
            const emailSelecionado = (usuarioLogado.cargo === 'Administrador') ? filtroColaboradorEl.value : usuarioLogado.email;
            carregarRegistros("tabelaHistorico", { mes: mes, ano: ano, emailUsuario: emailSelecionado });
        };
        if (usuarioLogado && usuarioLogado.cargo === 'Administrador') {
            adminFiltroContainer.style.display = 'flex';
            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const todosOption = document.createElement('option');
            todosOption.value = 'todos';
            todosOption.textContent = 'Todos os Colaboradores';
            filtroColaboradorEl.appendChild(todosOption);
            usuarios.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = user.nome;
                filtroColaboradorEl.appendChild(option);
            });
            filtroColaboradorEl.addEventListener('change', carregarRelatorio);
        }
        const hoje = new Date();
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        for (let i = 0; i < 12; i++) {
            const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const option = document.createElement('option');
            option.value = `${mes.getFullYear()}-${mes.getMonth()}`;
            option.textContent = `${meses[mes.getMonth()]} de ${mes.getFullYear()}`;
            filtroMesEl.appendChild(option);
        }
        filtroMesEl.addEventListener('change', carregarRelatorio);
        const botaoPDF = document.getElementById('btnGerarPDF');
        if (botaoPDF) {
            botaoPDF.addEventListener('click', gerarPDF);
        }
        carregarRelatorio();
    }
    if (document.title === "Bater Ponto") {
        carregarRegistros("tabelaPonto", { emailUsuario: usuarioLogado.email });
    }
});