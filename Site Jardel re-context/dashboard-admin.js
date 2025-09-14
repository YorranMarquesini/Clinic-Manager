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
        let lista = funcionarios.map((f, i) => `
            <li>${f.nome} (${f.username}) [${f.tipo}] - ${f.area} 
            <button onclick="removerFuncionario(${i})">Remover</button></li>
        `).join("");

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

    funcionarios.push({ nome, username, password: senha, tipo, area });
    localStorage.setItem("funcionarios", JSON.stringify(funcionarios));

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