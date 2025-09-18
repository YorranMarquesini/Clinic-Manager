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

// -------------------- Sidebar retrátil --------------------
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// -------------------- Inbox Simplificado --------------------
function listarMensagens() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    let inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    return inbox.filter(msg => msg.destinatario === usuario.nome);
}

function adicionarMensagem(destinatario, remetente, tipo, texto) {
    let inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    inbox.push({
        id: Date.now().toString(),
        destinatario,
        remetente,
        tipo,
        texto,
        data: new Date().toISOString()
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
            <p><strong>${msg.remetente}</strong>: ${msg.texto}</p>
            <small>${new Date(msg.data).toLocaleString('pt-BR')}</small>
        </div>
    `).join("");
}

function atualizarIndicadorInbox() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const inbox = JSON.parse(localStorage.getItem("inboxMensagens")) || [];
    const naoLidas = inbox.filter(msg => msg.destinatario === usuario.nome).length;
    const badge = document.getElementById("inboxBadge");
    if (!badge) return;

    if (naoLidas > 0) {
        badge.textContent = naoLidas;
        badge.style.display = "block"; // mostra o badge
    } else {
        badge.style.display = "none"; // esconde o badge
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
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (secao === "consultas") {
        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos = agendamentos.filter(a => a.paciente === usuario.nome);

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

        if (medicos.length === 0) {
            conteudo.innerHTML = `<div class="card"><p>Nenhum médico disponível.</p></div>`;
        } else {
            conteudo.innerHTML = `
                <div class="cards-container">
                    ${medicos.map((m) => {
                        return `
                            <div class="card">
                                <h3>Dr(a). ${m.nome}</h3>
                                <form onsubmit="marcarConsulta(event,'${m.nome}')">
                                    <label>Data: <input type="date" name="dataConsulta" required onchange="atualizarHorarios(this, '${m.nome}')"></label>
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
function atualizarHorarios(inputDate, nomeMedico) {
    const form = inputDate.closest("form");
    const select = form.querySelector("select[name='horarioConsulta']");
    select.innerHTML = "<option value=''>Carregando...</option>";

    const dataSelecionadaInput = inputDate.value;
    if (!dataSelecionadaInput) {
        select.innerHTML = "<option value=''>Escolha uma data</option>";
        return;
    }

    const dataSelecionada = new Date(dataSelecionadaInput);
    const agora = new Date();
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const agMedico = agendamentos.filter(a => a.medico === nomeMedico);

    let horarios = [];
    for (let h = 6; h < 22; h++) {
        for (let mnt of [0, 30]) {
            const dataHoraTemp = new Date(dataSelecionada);
            dataHoraTemp.setHours(h, mnt, 0, 0);

            if (dataHoraTemp <= agora && dataHoraTemp.toDateString() === agora.toDateString()) continue;

            const ocupado = agMedico.some(a => new Date(a.data).getTime() === dataHoraTemp.getTime());
            if (!ocupado) horarios.push(`${("0"+h).slice(-2)}:${("0"+mnt).slice(-2)}`);
        }
    }

    select.innerHTML = horarios.length
        ? horarios.map(h => `<option value="${h}">${h}</option>`).join("")
        : "<option value=''>Sem horários disponíveis</option>";
}

// -------------------- Marcar consulta --------------------
function marcarConsulta(event, nomeMedico){
    event.preventDefault();
    const form = event.target;
    const dataInput = form.dataConsulta.value;
    const horaInput = form.horarioConsulta.value;

    if(!dataInput || !horaInput){
        alert("Escolha uma data e horário válidos!");
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

    const [h, mnt] = horaInput.split(":");
    const [ano, mes, dia] = dataInput.split("-").map(Number);
    const dataHora = new Date(ano, mes - 1, dia, parseInt(h), parseInt(mnt), 0, 0);

    const conflito = agendamentos.some(a => a.medico === nomeMedico && new Date(a.data).getTime() === dataHora.getTime());
    if(conflito){
        alert("Este horário já está ocupado. Escolha outro.");
        return;
    }

    agendamentos.push({
        paciente: usuario.nome,
        data: dataHora.toISOString(),
        medico: nomeMedico,
        area: usuario.area || "Geral"
    });

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    // ✅ Notificação para o médico
    adicionarMensagem(nomeMedico, usuario.nome, "agendamento", 
        `O paciente ${usuario.nome} marcou uma consulta com você em ${dataHora.toLocaleString("pt-BR")}`);
    atualizarIndicadorInbox();

    alert(`Consulta agendada com Dr(a). ${nomeMedico} em ${dataHora.toLocaleString("pt-BR")}`);
    carregarConteudoPaciente('medicos');
}

// -------------------- Desmarcar consulta --------------------
function desmarcarConsulta(index) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const agendamento = agendamentos.filter(a => a.paciente === usuario.nome)[index];

    if (!agendamento) return;

    if (confirm(`Deseja realmente desmarcar a consulta com Dr(a). ${agendamento.medico} em ${new Date(agendamento.data).toLocaleString("pt-BR")}?`)) {
        agendamentos = agendamentos.filter(a => !(a.paciente === usuario.nome && a.data === agendamento.data && a.medico === agendamento.medico));
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        // ✅ Notificação para o médico
        adicionarMensagem(agendamento.medico, usuario.nome, "desmarcacao",
            `O paciente ${usuario.nome} desmarcou a consulta em ${new Date(agendamento.data).toLocaleString("pt-BR")}`);

        atualizarIndicadorInbox();
        alert("Consulta desmarcada com sucesso!");
        carregarConteudoPaciente('consultas');
    }
}
