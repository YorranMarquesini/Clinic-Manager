// -------------------- Login / Logout --------------------
function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

function checarLogin() {
    const usuario = localStorage.getItem("usuarioLogado");
    if (!usuario) window.location.href = "login.html";
}
checarLogin();

// -------------------- Sidebar retrátil --------------------
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// -------------------- Inbox modal --------------------
function abrirInbox() {
    document.getElementById("inboxModal").style.display = "block";
}

function fecharInbox() {
    document.getElementById("inboxModal").style.display = "none";
}

// Fecha modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById("inboxModal");
    if (event.target === modal) modal.style.display = "none";
};

// -------------------- Fechar inbox ao clicar fora --------------------
document.addEventListener("click", function(event) {
    const inbox = document.querySelector(".inbox");
    const dropdown = document.getElementById("inboxDropdown");
    if (dropdown && !inbox.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

// -------------------- Carregar conteúdo --------------------
function carregarConteudo(secao) {
    const conteudo = document.getElementById("conteudo");
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (secao === "calendario") {
        conteudo.innerHTML = `<div id="subConteudo"></div>`;
        mostrarCalendario();
    }
    else if (secao === "pacientes") {
        conteudo.innerHTML = `
            <h2>👥 Pacientes</h2>
            <button onclick="verPacientes()">Ver Pacientes</button>
            <button onclick="cadastrarPaciente()">Cadastrar Paciente</button>
            <div id="subConteudo"></div>
        `;
    }
    else if (secao === "consultas") {
        conteudo.innerHTML = `
            <h2>📋 Agendamentos</h2>
            <button onclick="verAgendamentos()">Ver Agendamentos</button>
            <button onclick="cadastrarAgendamento()">Cadastrar Agendamento</button>
            <div id="subConteudo"></div>
        `;
    }

    document.querySelectorAll(".sidebar a").forEach(link => link.classList.remove("active"));
    event?.target?.classList.add("active");
}

// -------------------- Pacientes --------------------
function verPacientes() {
    const sub = document.getElementById("subConteudo");
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    pacientes = pacientes.filter(p => p.area === usuario.area);

    if (pacientes.length === 0) {
        sub.innerHTML = `<div class="card"><p>Nenhum paciente cadastrado.</p></div>`;
        return;
    }

    let lista = pacientes.map((p, i) => `
        <li>${p.nome} - ${p.idade} anos (Cadastrado por: ${p.cadastradoPor || "Desconhecido"}) 
        <button onclick="removerPaciente(${i})">Remover</button></li>
    `).join("");

    sub.innerHTML = `<div class="card"><ul>${lista}</ul></div>`;
}

function cadastrarPaciente() {
    const sub = document.getElementById("subConteudo");
    sub.innerHTML = `
        <div class="card">
            <h3>Adicionar Paciente</h3>
            <form id="formPaciente">
                <input type="text" placeholder="Nome" id="nomePaciente" required>
                <input type="number" placeholder="Idade" id="idadePaciente" required>
                <button type="submit">Salvar</button>
            </form>
            <div id="msgPaciente"></div>
        </div>
    `;

    document.getElementById("formPaciente").addEventListener("submit", function(e){
        e.preventDefault();
        const nome = document.getElementById("nomePaciente").value;
        const idade = document.getElementById("idadePaciente").value;
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

        let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        pacientes.push({ nome, idade, area: usuario.area, cadastradoPor: usuario.nome });
        localStorage.setItem("pacientes", JSON.stringify(pacientes));

        document.getElementById("msgPaciente").innerHTML = "<p style='color:green'>Paciente cadastrado!</p>";
        document.getElementById("formPaciente").reset();
    });
}

function removerPaciente(index) {
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    const pacienteRemovido = pacientes.filter(p => p.area === usuario.area)[index];

    if (confirm(`Deseja realmente remover o paciente "${pacienteRemovido.nome}"? Todos os agendamentos dele também serão excluídos.`)) {
        pacientes = pacientes.filter(p => !(p.area === usuario.area && p.nome === pacienteRemovido.nome));
        localStorage.setItem("pacientes", JSON.stringify(pacientes));

        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos = agendamentos.filter(a => a.paciente !== pacienteRemovido.nome || a.area !== usuario.area);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        verPacientes();
    }
}

// -------------------- Agendamentos --------------------
function verAgendamentos() {
    const sub = document.getElementById("subConteudo");
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    agendamentos = agendamentos.filter(a => a.area === usuario.area);

    if (agendamentos.length === 0) {
        sub.innerHTML = `<div class="card"><p>Sem agendamentos.</p></div>`;
    } else {
        sub.innerHTML = `
            <div class="card">
                <h3>Lista de Agendamentos</h3>
                <ul>
                    ${agendamentos.map((a, idx) => {
                        const horario = new Date(a.data).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                        return `
                            <li>
                                ${horario} - ${a.paciente} (Dr(a). ${a.medico})
                                <button onclick="removerAgendamento(${idx})">Remover</button>
                            </li>
                        `;
                    }).join("")}
                </ul>
            </div>
        `;
    }
}

function cadastrarAgendamento() {
    const sub = document.getElementById("subConteudo");
    const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const pacientesArea = pacientes.filter(p => p.area === usuario.area);

    if (pacientesArea.length === 0) {
        sub.innerHTML = `<div class="card"><p>⚠️ Cadastre pacientes antes de agendar!</p></div>`;
        return;
    }

    let options = pacientesArea.map(p => `<option value="${p.nome}">${p.nome}</option>`).join("");

    sub.innerHTML = `
        <div class="card">
            <h3>Adicionar Agendamento</h3>
            <form id="formAgendamento">
                <label>Paciente:</label>
                <select id="pacienteAgendamento" required>
                    <option value="">Selecione o paciente</option>
                    ${options}
                </select>
                <label>Data e horário:</label>
                <input type="datetime-local" id="dataAgendamento" required>
                <button type="submit">Salvar</button>
            </form>
            <div id="msgAgendamento"></div>
        </div>
    `;

    document.getElementById("formAgendamento").addEventListener("submit", function(e){
        e.preventDefault();
        const paciente = document.getElementById("pacienteAgendamento").value;
        const data = document.getElementById("dataAgendamento").value;

        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos.push({ paciente, data, area: usuario.area, medico: usuario.nome });
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        document.getElementById("msgAgendamento").innerHTML = "<p style='color:green'>✅ Agendamento cadastrado!</p>";
        document.getElementById("formAgendamento").reset();
    });
}

function removerAgendamento(index) {
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    // filtra apenas da área do usuário
    let agendamentosArea = agendamentos.filter(a => a.area === usuario.area);

    // remove o agendamento selecionado da área
    agendamentosArea.splice(index, 1);

    // junta de volta com os agendamentos de outras áreas
    let outros = agendamentos.filter(a => a.area !== usuario.area);
    agendamentos = [...outros, ...agendamentosArea];

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    verAgendamentos();
}

function removerAgendamento(index) {
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    if(confirm("Deseja realmente remover este agendamento?")) {
        agendamentos.splice(index, 1);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
        verAgendamentos();
    }
}
// -------------------- Calendario --------------------
function mostrarCalendario() {
    const sub = document.getElementById("subConteudo");
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    agendamentos = agendamentos.filter(a => a.area === usuario.area);

    let hoje = new Date();
    let mesAtual = hoje.getMonth();
    let anoAtual = hoje.getFullYear();
    const cores = ["#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff"];

    function renderizarCalendario(mes, ano) {
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);

        let html = `<div class="card"><h3>Calendário - ${primeiroDia.toLocaleString('pt-BR', {month: 'long', year: 'numeric'})}</h3>
                    <button onclick="alterarMes(-1)">&#8592; Mês Anterior</button>
                    <button onclick="alterarMes(1)">Próximo Mês &#8594;</button>
                    <table>
                        <tr><th>Dom</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sáb</th></tr>`;

        let dia = 1;
        for (let i = 0; i < 6; i++) {
            html += "<tr>";
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < primeiroDia.getDay()) || dia > ultimoDia.getDate()) {
                    html += "<td></td>";
                } else {
                    const agsDoDia = agendamentos.filter(a => {
                        const dataAg = new Date(a.data);
                        return dataAg.getDate() === dia && dataAg.getMonth() === mes && dataAg.getFullYear() === ano;
                    });

                    if (agsDoDia.length > 0) {
                        let detalhes = "<div class='detalhes'><ul>";
                        agsDoDia.forEach((a, idx) => {
                            const horario = new Date(a.data).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                            const cor = cores[idx % cores.length];
                            detalhes += `<li style="background-color:${cor}">${horario} - ${a.paciente} (Dr(a). ${a.medico})</li>`;
                        });
                        detalhes += "</ul></div>";
                        html += `<td class="agendado"><strong>${dia}</strong>${detalhes}</td>`;
                    } else {
                        html += `<td><strong>${dia}</strong></td>`;
                    }
                    dia++;
                }
            }
            html += "</tr>";
            if (dia > ultimoDia.getDate()) break;
        }
        html += "</table></div>";
        sub.innerHTML = html;
    }

    window.alterarMes = function(delta) {
        mesAtual += delta;
        if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
        if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
        renderizarCalendario(mesAtual, anoAtual);
    }

    renderizarCalendario(mesAtual, anoAtual);
}
