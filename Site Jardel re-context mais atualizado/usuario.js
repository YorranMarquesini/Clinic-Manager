// -------------------- Checar login --------------------
function checarLogin() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || !usuario.senha) { // garante que é paciente
        window.location.href = "login.html";
    }
}
checarLogin();

// -------------------- Logout --------------------
function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

// -------------------- Inicialização: garantir IDs simples --------------------
(function ensureIdsForPacientePage(){
    let funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    let changed = false;
    for (let i = 0; i < funcionarios.length; i++) {
        if (!funcionarios[i].id) { funcionarios[i].id = Date.now().toString() + i; changed = true; }
    }
    for (let i = 0; i < pacientes.length; i++) {
        if (!pacientes[i].id) { pacientes[i].id = Date.now().toString() + (1000 + i); changed = true; }
    }
    if (changed) {
        localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
        localStorage.setItem("pacientes", JSON.stringify(pacientes));
    }
})();

// -------------------- Sidebar retrátil --------------------
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// -------------------- Helpers --------------------
function getUserByIdOrFallback(idOrName) {
    const funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
    const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    let u = funcionarios.find(f => f.id === idOrName || f.username === idOrName || f.nome === idOrName);
    if (u) return u;
    u = pacientes.find(p => p.id === idOrName || p.login === idOrName || p.nome === idOrName);
    return u;
}

// -------------------- Inbox Simplificado --------------------
function listarMensagens() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
    let inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];

    return inbox.filter(msg => msg.destinatarioId === usuario.id);
}

function adicionarMensagem(destinatarioId, remetenteId, tipo, texto) {
    let inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    const destinatarioObj = getUserByIdOrFallback(destinatarioId) || {};
    const remetenteObj = getUserByIdOrFallback(remetenteId) || {};

    inbox.push({
        id: Date.now().toString(),
        destinatarioId: destinatarioObj.id || destinatarioId || null,
        remetenteId: remetenteObj.id || remetenteId || "system",
        destinatarioNome: destinatarioObj.nome || destinatarioObj.login || destinatarioId || "",
        remetenteNome: remetenteObj.nome || remetenteObj.login || (remetenteId === "system" ? "Sistema" : remetenteId),
        tipo,
        texto,
        data: new Date().toISOString(),
        lidoPorDestinatario: false,
        lidoPorRemetente: false // permite controlar visibilidade separadamente
    });

    localStorage.setItem("inboxMensagens", JSON.stringify(inbox));
    atualizarIndicadorInbox();
}

function removerMensagem(id) {
    let inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    inbox = inbox.filter(msg => msg.id !== id);
    localStorage.setItem("inboxMensagens", JSON.stringify(inbox));
    renderizarInbox();
    atualizarIndicadorInbox();
    return; // já trata aqui, não precisa do resto
}

function renderizarInbox() {
    const mensagens = listarMensagens();
    const container = document.getElementById("inboxDropdown");
    if (!container) return;

    if (mensagens.length === 0) {
        container.innerHTML = `<p>Sem novas mensagens.</p>`;
        return;
    }

    container.innerHTML = mensagens.map(msg => `
        <div class="mensagem" onclick="removerMensagem('${msg.id}')">
            <p><strong>${msg.remetenteNome || msg.remetente}</strong>: ${msg.texto}</p>
            <small>${new Date(msg.data).toLocaleString('pt-BR')}</small>
        </div>
    `).join("");
}

function atualizarIndicadorInbox() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
    const inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    const naoLidas = inbox.filter(msg => msg.destinatarioId === usuario.id).length;
    const badge = document.getElementById("inboxBadge");
    if (!badge) return;

    if (naoLidas > 0) {
        badge.textContent = naoLidas;
        badge.style.display = "block";
    } else {
        badge.style.display = "none";
    }
}

function abrirInbox() {
    const dropdown = document.getElementById("inboxDropdown");
    if (!dropdown) return;
    dropdown.style.display = "block";
    renderizarInbox();
}

function fecharInbox() {
    const dropdown = document.getElementById("inboxDropdown");
    if (dropdown) dropdown.style.display = "none";
}

// Fecha inbox clicando fora
document.addEventListener("click", function(event) {
    const inbox = document.querySelector(".inbox");
    const dropdown = document.getElementById("inboxDropdown");
    if (dropdown && !inbox.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

// Inicializa o badge de mensagens
atualizarIndicadorInbox();

// -------------------- Carregar conteúdo do paciente --------------------
function carregarConteudoPaciente(secao) {
    const conteudo = document.getElementById("conteudo");
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || {};

    if (secao === "consultas") {
        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos = agendamentos.filter(a => (a.pacienteId ? a.pacienteId === usuario.id : a.paciente === usuario.nome));

        if (agendamentos.length === 0) {
            conteudo.innerHTML = `<div class="card"><p>Você não possui consultas agendadas.</p></div>`;
        } else {
            conteudo.innerHTML = `
                <div class="card">
                    <h3>Minhas Consultas</h3>
                    <ul>
                        ${agendamentos.map((a, idx) => {
                            const data = new Date(a.data).toLocaleString("pt-BR");
                            return `<li>${data} - Dr(a). ${a.medico} <button onclick="desmarcarConsulta(${idx})">Desmarcar</button></li>`;
                        }).join("")}
                    </ul>
                </div>
            `;
        }

    } else if (secao === "medicos") {
    let funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
    const medicos = funcionarios.filter(f => f.tipo === "medico");

    const medicosPermitidos = medicos.filter(m => m.area === usuario.area);

    if (medicosPermitidos.length === 0) {
        conteudo.innerHTML = `<div class="card"><p>Nenhum médico disponível na sua área (${usuario.area}).</p></div>`;
    } else {
        conteudo.innerHTML = `
            <div class="cards-container">
                ${medicosPermitidos.map((m) => {
                    return `
                        <div class="card">
                            <h3>Dr(a). ${m.nome} <small>(${m.area || "Geral"})</small></h3>
                            <form onsubmit="marcarConsulta(event,'${m.id}')">
                                <label>Data: <input type="date" name="dataConsulta" required onchange="atualizarHorarios(this, '${m.id}')"></label>
                                <label>Horário:
                                    <select name="horarioConsulta" required>
                                        <option value="">Escolha uma data</option>
                                    </select>
                                </label>
                                <button type="submit">Agendar</button>
                            </form>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }
}
}

// -------------------- Atualizar horários disponíveis --------------------
function atualizarHorarios(inputDate, nomeMedicoOrId) {
    const form = inputDate.closest("form");
    const select = form.querySelector("select[name='horarioConsulta']");
    select.innerHTML = "<option value=''>Carregando...</option>";

    const dataSelecionadaInput = inputDate.value;
    if (!dataSelecionadaInput) {
        select.innerHTML = "<option value=''>Escolha uma data</option>";
        return;
    }

    // Criar data no horário local (sem problema de UTC)
    const [ano, mes, dia] = dataSelecionadaInput.split("-").map(Number);
    const dataSelecionada = new Date(ano, mes - 1, dia);

    const agora = new Date();

    // Pegar agendamentos do médico
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const agMedico = agendamentos.filter(a => (a.medicoId ? a.medicoId === nomeMedicoOrId : a.medico === nomeMedicoOrId));

    let horarios = [];

    for (let h = 6; h < 18; h++) {
        for (let mnt of [0, 30]) {
            // Criar horário específico no dia selecionado
            const dataHoraTemp = new Date(ano, mes - 1, dia, h, mnt, 0, 0);

            // Bloqueia qualquer horário que já passou
            if (dataHoraTemp <= agora) continue;

            // Verifica se já está ocupado
            const ocupado = agMedico.some(a => new Date(a.data).getTime() === dataHoraTemp.getTime());
            if (!ocupado) horarios.push(`${("0"+h).slice(-2)}:${("0"+mnt).slice(-2)}`);
        }
    }

    select.innerHTML = horarios.length
        ? horarios.map(h => `<option value="${h}">${h}</option>`).join("")
        : "<option value=''>Sem horários disponíveis</option>";
}

// -------------------- Marcar consulta --------------------
function marcarConsulta(event, medicoId){
    event.preventDefault();
    const form = event.target;
    const dataInput = form.dataConsulta.value;
    const horaInput = form.horarioConsulta.value;

    if(!dataInput || !horaInput){
        alert("Escolha uma data e horário válidos!");
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    const [h, mnt] = horaInput.split(":");
    const [ano, mes, dia] = dataInput.split("-").map(Number);
    const dataHora = new Date(ano, mes - 1, dia, parseInt(h), parseInt(mnt), 0, 0);

    const funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
    const medicoObj = funcionarios.find(f => f.id === medicoId);
    if (!medicoObj) {
        alert("Médico não encontrado.");
        return;
    }

    const conflito = agendamentos.some(a => (a.medicoId ? a.medicoId === medicoObj.id : a.medico === medicoObj.nome) && new Date(a.data).getTime() === dataHora.getTime());
    if(conflito){
        alert("Este horário já está ocupado. Escolha outro.");
        return;
    }

    agendamentos.push({
        paciente: usuario.nome,
        pacienteId: usuario.id,
        data: dataHora.toISOString(),
        medico: medicoObj.nome,
        medicoId: medicoObj.id,
        area: medicoObj.area || "Geral"
    });

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    // ✅ Notificação para o médico (usar IDs)
    adicionarMensagem(medicoObj.id, usuario.id, "agendamento", 
        `O paciente ${usuario.nome} marcou uma consulta com você em ${dataHora.toLocaleString("pt-BR")}`);
    atualizarIndicadorInbox();

    alert(`Consulta agendada com Dr(a). ${medicoObj.nome} (${medicoObj.area}) em ${dataHora.toLocaleString("pt-BR")}`);
    carregarConteudoPaciente('medicos');
}

// -------------------- Desmarcar consulta --------------------
function desmarcarConsulta(index) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const minhas = agendamentos.filter(a => (a.pacienteId ? a.pacienteId === usuario.id : a.paciente === usuario.nome));
    const agendamento = minhas[index];

    if (!agendamento) return;

    if (confirm(`Deseja realmente desmarcar a consulta com Dr(a). ${agendamento.medico} em ${new Date(agendamento.data).toLocaleString("pt-BR")}?`)) {
        agendamentos = agendamentos.filter(a => !( (a.pacienteId ? a.pacienteId === usuario.id : a.paciente === usuario.nome) && a.data === agendamento.data && (a.medicoId ? a.medicoId === agendamento.medicoId : a.medico === agendamento.medico) ));
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        // ✅ Notificação para o médico
        const medicoId = agendamento.medicoId || (JSON.parse(localStorage.getItem("funcionarios")) || []).find(f => f.nome === agendamento.medico)?.id;
        if (medicoId) {
            adicionarMensagem(medicoId, usuario.id, "desmarcacao",
                `O paciente ${usuario.nome} desmarcou a consulta em ${new Date(agendamento.data).toLocaleString("pt-BR")}`);
        }

        atualizarIndicadorInbox();
        alert("Consulta desmarcada com sucesso!");
        carregarConteudoPaciente('consultas');
    }
}
