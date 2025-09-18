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

// -------------------- Banco de dados simulado --------------------
let funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];

// -------------------- Carregar conteúdo --------------------
function carregarConteudo(secao) {
    const conteudo = document.getElementById("conteudo");

    if (secao === "Adicionar") {
        conteudo.innerHTML = `
            <h2>➕ Adicionar Funcionário</h2>
            <form id="formAdicionar">
                <input type="text" placeholder="Nome" id="nome" required><br><br>
                <input type="text" placeholder="Username" id="username" required><br><br>
                <input type="password" placeholder="Senha" id="senha" required><br><br>
                <select id="tipo" required>
                    <option value="">Selecione o tipo</option>
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                </select><br><br>
                <select id="area" required>
                    <option value="">Selecione a área</option>
                    <option value="Odonto">Odonto</option>
                    <option value="Nutrição">Nutrição</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Psicologia">Psicologia</option>
                </select><br><br>
                <button type="submit">Adicionar</button>
            </form>
            <div id="msgAdicionar"></div>
        `;

        document.getElementById("formAdicionar").addEventListener("submit", function(e) {
            e.preventDefault();
            adicionarFuncionario();
        });

    } else if (secao === "Remover") {
        let lista = funcionarios.map((f, i) => {
            let tipoLabel = "";
            if (f.tipo === "admin") {
                tipoLabel = "Administrador";
            } else if (f.tipo === "medico") {
                tipoLabel = `Médico (${f.area})`;
            } else {
                tipoLabel = "Funcionário";
            }

            return `
                <li>
                    ${f.nome} (${f.username}) - ${tipoLabel}
                    <button onclick="removerFuncionario(${i})">Remover</button>
                </li>
            `;
        }).join("");

        if (!lista) lista = "<p>Nenhum funcionário cadastrado.</p>";

        conteudo.innerHTML = `
            <h2>➖ Remover Funcionário</h2>
            <ul>${lista}</ul>
        `;

    } else if (secao === "avisos") {
        let avisos = JSON.parse(localStorage.getItem("avisos")) || [];
        let lista = avisos.map((a, i) => `
            <li>
              ${a} 
              <button onclick="removerAviso(${i})">Remover</button>
            </li>
        `).join("");

        if (!lista) lista = "<p>Nenhum aviso cadastrado.</p>";

        conteudo.innerHTML = `
            <h2>📢 Gerenciar Avisos</h2>
            <form id="formAviso">
                <input type="text" id="novoAviso" placeholder="Digite o aviso" required>
                <button type="submit">Adicionar</button>
            </form>
            <ul>${lista}</ul>
        `;

        document.getElementById("formAviso").addEventListener("submit", function(e) {
            e.preventDefault();
            adicionarAviso();
        });

    } else if (secao === "Calendario") {
        mostrarCalendario();
    }

    // Destaque item ativo
    document.querySelectorAll(".sidebar a").forEach(link => link.classList.remove("active"));
    event?.target?.classList.add("active");
}

// -------------------- Adicionar Funcionário --------------------
function adicionarFuncionario() {
    const nome = document.getElementById("nome").value;
    const username = document.getElementById("username").value;
    const senha = document.getElementById("senha").value;
    const tipo = document.getElementById("tipo").value;
    const area = document.getElementById("area").value;

    if (funcionarios.find(f => f.username === username)) {
        document.getElementById("msgAdicionar").innerHTML = "<p style='color:red'>Username já existe!</p>";
        return;
    }

    // Áreas médicas
    const areasMedicas = ["Odonto", "Nutrição", "Pediatria", "Fisioterapia", "Psicologia"];

    // Se a área for médica, o tipo será sempre "medico"
    let tipoFinal = tipo;
    if (areasMedicas.includes(area)) {
        tipoFinal = "medico";
    }

    funcionarios.push({ nome, username, password: senha, tipo: tipoFinal, area });
    localStorage.setItem("funcionarios", JSON.stringify(funcionarios));

    // ✅ Mensagem de sucesso
    document.getElementById("msgAdicionar").innerHTML = "<p style='color:green'>Funcionário adicionado com sucesso!</p>";
    document.getElementById("formAdicionar").reset();
}

// -------------------- Remover Funcionário --------------------
function removerFuncionario(index) {
    if (confirm("Deseja realmente remover este funcionário?")) {
        const funcionario = funcionarios[index]; // guarda dados do médico a ser removido

        // 1. Remover pacientes cadastrados por ele
        let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        pacientes = pacientes.filter(p => p.area !== funcionario.area || p.cadastradoPor !== funcionario.nome);
        localStorage.setItem("pacientes", JSON.stringify(pacientes));

        // 2. Remover agendamentos desse médico
        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos = agendamentos.filter(a => a.medico !== funcionario.nome);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        // 3. Remover o próprio funcionário
        funcionarios.splice(index, 1);
        localStorage.setItem("funcionarios", JSON.stringify(funcionarios));

        alert(`Funcionário ${funcionario.nome} e todos os registros relacionados foram removidos.`);
        carregarConteudo("Remover");
    }
}

// -------------------- Info Cards --------------------
function adicionarAviso() {
    let avisos = JSON.parse(localStorage.getItem("avisos")) || [];
    const novo = document.getElementById("novoAviso").value;

    avisos.push(novo);
    localStorage.setItem("avisos", JSON.stringify(avisos));

    carregarConteudo("avisos");
}

function removerAviso(index) {
    let avisos = JSON.parse(localStorage.getItem("avisos")) || [];
    avisos.splice(index, 1);
    localStorage.setItem("avisos", JSON.stringify(avisos));

    carregarConteudo("avisos");
}

// -------------------- Calendário --------------------
function mostrarCalendario() {
    const conteudo = document.getElementById("conteudo");
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

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
                            detalhes += `<li style="background-color:${cor}">${horario} - ${a.paciente} (Dr(a). ${a.medico} - ${a.area})</li>`;
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
        conteudo.innerHTML = html;
    }

    window.alterarMes = function(delta) {
        mesAtual += delta;
        if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
        if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
        renderizarCalendario(mesAtual, anoAtual);
    }

    renderizarCalendario(mesAtual, anoAtual);
}
