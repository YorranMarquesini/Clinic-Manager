// -------------------- Login / Logout --------------------
function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
}

function checarLogin() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) window.location.href = "login.html";
}
checarLogin();

// -------------------- Sidebar retrátil --------------------
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// -------------------- Inbox de Notificações --------------------
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
        container.innerHTML = `<p>Sem novas notificações.</p>`;
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

document.addEventListener("click", function(event) {
    const inbox = document.querySelector(".inbox");
    const dropdown = document.getElementById("inboxDropdown");
    if (dropdown && !inbox.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

atualizarIndicadorInbox();

// -------------------- Funções de Notificação de Consultas --------------------
function notificarConsulta(destinatario, consulta, marcada) {
    const remetente = "Sistema";
    const texto = marcada
        ? `Consulta marcada: ${consulta.data} com ${consulta.medico}`
        : `Consulta desmarcada: ${consulta.data} com ${consulta.medico}`;
    adicionarMensagem(destinatario, remetente, "consulta", texto);
}

// -------------------- Carregar conteúdo --------------------
function carregarConteudo(secao, event) {
    const conteudo = document.getElementById("conteudo");

    if (secao === "calendario") {
        conteudo.innerHTML = `<div id="subConteudo"></div>`;
        mostrarCalendario();
    } else if (secao === "pacientes") {
        conteudo.innerHTML = `
            <h2>👥 Pacientes</h2>
            <button onclick="verPacientes()">Ver Pacientes</button>
            <button onclick="cadastrarPaciente()">Cadastrar Paciente</button>
            <div id="subConteudo"></div>
        `;
    } else if (secao === "consultas") {
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
        sub.innerHTML = `<div class="card"><p>Sem pacientes cadastrados.</p></div>`;
    } else {
        sub.innerHTML = `
            <div class="card">
                <h3>Lista de Pacientes</h3>
                <ul>
                    ${pacientes.map((p, index) => {
                        const idade = calcularIdade(p.nascimento);
                        return `
                            <li>
                                <span style="cursor:pointer; color:blue;" onclick="verPacienteDetalhes(${index})">
                                    ${p.nome} - ${idade} anos
                                </span>
                                <button onclick="removerPaciente(${index})">Remover</button>
                            </li>
                        `;
                    }).join("")}
                </ul>
            </div>
        `;
    }
}

function cadastrarPaciente() {
    const sub = document.getElementById("subConteudo");
    sub.innerHTML = `
        <!-- Dependências do Flatpickr -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js"></script>

        <div class="card">
            <h3>Adicionar Paciente</h3>
            <form id="formPaciente">
                <input type="text" placeholder="Nome" id="nomePaciente" required>
                <input type="text" id="nascimentoPaciente" placeholder="Data de nascimento" required>
                <button type="submit">Salvar</button>
            </form>
            <div id="msgPaciente"></div>
        </div>
    `;

    // Ativa o calendário Flatpickr para nascimento
    flatpickr("#nascimentoPaciente", {
        dateFormat: "d/m/Y",
        locale: "pt",
        maxDate: "today" // não deixa escolher datas futuras
    });

    document.getElementById("formPaciente").addEventListener("submit", function(e){
        e.preventDefault();
        const nome = document.getElementById("nomePaciente").value.trim();
        const nascimento = document.getElementById("nascimentoPaciente").value;
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

        if (!nome || !nascimento) {
            document.getElementById("msgPaciente").innerHTML = "<p style='color:red'>⚠️ Preencha todos os campos!</p>";
            return;
        }

        // Converte para formato YYYY-MM-DD antes de salvar
        const partes = nascimento.split("/");
        const nascimentoISO = `${partes[2]}-${partes[1]}-${partes[0]}`;

        const senha = partes[0] + partes[1] + partes[2].slice(2); // ddmmaa

        let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        pacientes.push({
            nome,
            nascimento: nascimentoISO,
            area: usuario.area,
            cadastradoPor: usuario.nome,
            login: nome.toLowerCase(),
            senha
        });
        localStorage.setItem("pacientes", JSON.stringify(pacientes));

        document.getElementById("msgPaciente").innerHTML = `<p style='color:green'>✅ Paciente cadastrado! Login: ${nome.toLowerCase()}, Senha: ${senha}</p>`;
        document.getElementById("formPaciente").reset();
    });
}

function verPacienteDetalhes(index) {
    const sub = document.getElementById("subConteudo");
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    pacientes = pacientes.filter(p => p.area === usuario.area);
    const paciente = pacientes[index];

    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    // filtra apenas agendamentos concluídos do paciente
    let passados = agendamentos.filter(a => 
        a.paciente === paciente.nome && 
        a.area === usuario.area && 
        a.concluida === true
    );

    sub.innerHTML = `
        <div class="card">
            <h3>Detalhes do Paciente</h3>
            <form id="formDetalhesPaciente">
                <p><b>Nome:</b> ${paciente.nome}</p>
                <p><b>Nascimento:</b> ${paciente.nascimento}</p>

                <label>Celular:</label>
                <input type="text" id="celularPaciente" value="${paciente.celular || ""}">

                <label>Email:</label>
                <input type="email" id="emailPaciente" value="${paciente.email || ""}">

                <button type="submit">Salvar Dados</button>
            </form>

            <h4>Agendamentos Concluídos</h4>
            ${passados.length === 0 
                ? "<p>Sem agendamentos concluídos.</p>" 
                : `
                <label for="selectAgendamento">Selecione um agendamento:</label>
                <select id="selectAgendamento">
                    <option value="">-- Escolha --</option>
                    ${passados.map((a, idx) => {
                        const data = new Date(a.data).toLocaleString("pt-BR");
                        return `<option value="${idx}">${data} - Dr(a). ${a.medico} ✅ Concluída</option>`;
                    }).join("")}
                </select>

                <div id="notaContainer" style="margin-top:10px; display:none;">
                    <textarea id="notaAgendamento" rows="6" style="width:100%;"></textarea>
                    <button id="salvarNotaBtn">Salvar Nota</button>
                </div>
                `}
            <button onclick="verPacientes()">⬅ Voltar</button>
        </div>
    `;

    // salvar celular/email
    document.getElementById("formDetalhesPaciente").addEventListener("submit", function(e){
        e.preventDefault();
        let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        pacientes = pacientes.filter(p => p.area === usuario.area);

        pacientes[index].celular = document.getElementById("celularPaciente").value.trim();
        pacientes[index].email = document.getElementById("emailPaciente").value.trim();

        let todosPacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        const realIndex = todosPacientes.findIndex(p => p.nome === paciente.nome && p.area === usuario.area);
        if (realIndex >= 0) {
            todosPacientes[realIndex] = pacientes[index];
            localStorage.setItem("pacientes", JSON.stringify(todosPacientes));
        }

        alert("✅ Dados do paciente salvos!");
    });

    // se houver agendamentos concluídos, configurar select
    if (passados.length > 0) {
        const selectAgendamento = document.getElementById("selectAgendamento");
        const notaContainer = document.getElementById("notaContainer");
        const textarea = document.getElementById("notaAgendamento");
        const salvarNotaBtn = document.getElementById("salvarNotaBtn");

        let idxSelecionado = null;

        selectAgendamento.addEventListener("change", function() {
            idxSelecionado = this.value;
            if (idxSelecionado !== "") {
                notaContainer.style.display = "block";
                textarea.value = passados[idxSelecionado].nota || "";
            } else {
                notaContainer.style.display = "none";
            }
        });

        salvarNotaBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (idxSelecionado === null || idxSelecionado === "") {
                alert("Selecione um agendamento primeiro!");
                return;
            }

            let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
            const agendamentoEscolhido = passados[idxSelecionado];
            const nota = textarea.value.trim();

            // achar índice real no storage
            const indexReal = agendamentos.findIndex(a => a.paciente === agendamentoEscolhido.paciente && a.data === agendamentoEscolhido.data);
            if (indexReal >= 0) {
                agendamentos[indexReal].nota = nota;
                localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
                alert("✅ Nota salva!");
            }
        });
    }
}

function removerPaciente(index) {
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const pacienteRemovido = pacientes.filter(p => p.area === usuario.area)[index];

    if (confirm(`Deseja realmente remover o paciente "${pacienteRemovido.nome}"?`)) {
        pacientes = pacientes.filter(p => !(p.area === usuario.area && p.nome === pacienteRemovido.nome));
        localStorage.setItem("pacientes", JSON.stringify(pacientes));

        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        agendamentos = agendamentos.filter(a => a.paciente !== pacienteRemovido.nome || a.area !== usuario.area);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        verPacientes();
    }
}

function calcularIdade(dataNasc) {
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    if (hoje.getMonth() < nascimento.getMonth() || 
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
}

// -------------------- Agendamentos --------------------
function verAgendamentos() {
    const sub = document.getElementById("subConteudo");
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    
    const agora = new Date();
    const limiteHoras = 24; // consultas concluídas desaparecem após 24h
    const limiteTempo = agora.getTime() - limiteHoras * 60 * 60 * 1000;

    // filtra agendamentos da área e ainda visíveis
    agendamentos = agendamentos.filter(a => 
        a.area === usuario.area &&
        (!a.concluida || new Date(a.data).getTime() >= limiteTempo)
    );

    if (agendamentos.length === 0) {
        sub.innerHTML = `<div class="card"><p>Sem agendamentos.</p></div>`;
    } else {
        sub.innerHTML = `
            <div class="card">
                <h3>Lista de Agendamentos</h3>
                <ul>
                    ${agendamentos.map((a, idx) => {
                        const horario = new Date(a.data);
                        const horarioFormatado = horario.toLocaleString("pt-BR", { 
                            day:"2-digit", month:"2-digit", year:"numeric", 
                            hour:"2-digit", minute:"2-digit" 
                        });

                        let botoes = "";

                        if (!a.concluida) {
                            botoes = `<button onclick="removerAgendamento(${idx})">Remover</button>`;
                            if (horario >= agora) {
                                botoes += ` <button onclick="iniciarConsulta(${idx})">Iniciar Consulta</button>`;
                            }
                        } else {
                            botoes = `<span style="color:green; font-weight:bold;">✅ Concluída</span>`;
                        }

                        return `
                            <li>
                                ${horarioFormatado} - ${a.paciente} (Dr(a). ${a.medico})
                                ${botoes}
                            </li>
                        `;
                    }).join("")}
                </ul>
            </div>
        `;
    }

    //limpa automaticamente agendamentos concluídos antigos do storage
    let agendamentosStorage = JSON.parse(localStorage.getItem("agendamentos")) || [];
    agendamentosStorage = agendamentosStorage.filter(a => !a.concluida || new Date(a.data).getTime() >= limiteTempo);
    localStorage.setItem("agendamentos", JSON.stringify(agendamentosStorage));
}

function iniciarConsulta(index) {
    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const agendamento = agendamentos[index];

    const sub = document.getElementById("subConteudo");

    sub.innerHTML = `
        <div class="card">
            <h3>Consulta em andamento</h3>
            <p><b>Paciente:</b> ${agendamento.paciente}</p>
            <p><b>Médico:</b> Dr(a). ${agendamento.medico}</p>
            <p><b>Data/Horário:</b> ${new Date(agendamento.data).toLocaleString("pt-BR")}</p>

            <label>Notas da consulta:</label>
            <textarea id="notaConsulta" rows="6" style="width:100%;"></textarea>

            <div style="margin-top:10px;">
                <button onclick="salvarNotaConsulta(${index})">Encerrar Consulta</button>
                <button onclick="verAgendamentos()">⬅ Voltar</button>
            </div>
        </div>
    `;
}

function salvarNotaConsulta(index) {
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    const agendamento = agendamentos[index];
    const nota = document.getElementById("notaConsulta").value.trim();

    if (!nota) {
        alert("⚠ Escreva alguma nota antes de salvar!");
        return;
    }

    // Marca a consulta como concluída
    agendamento.concluida = true;
    agendamento.nota = nota; // <-- Adicionado aqui
    agendamentos[index] = agendamento;
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

    // Atualiza histórico do paciente
    let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
    const pacienteIndex = pacientes.findIndex(p => p.nome === agendamento.paciente);

    if (pacienteIndex !== -1) {
        if (!pacientes[pacienteIndex].historico) pacientes[pacienteIndex].historico = [];
        pacientes[pacienteIndex].historico.push({
            data: agendamento.data,
            medico: agendamento.medico,
            nota
        });
        localStorage.setItem("pacientes", JSON.stringify(pacientes));
    }

    alert("✅ Nota salva e consulta concluída!");
    verAgendamentos();
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

    let optionsPacientes = pacientesArea.map(p => `<option value="${p.login}">${p.nome}</option>`).join("");

    function gerarHorariosDisponiveis(dataSelecionada) {
        const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        const agendamentosMedico = agendamentos.filter(a => a.medico === usuario.nome);

        let horarios = [];
        const agora = new Date(); // horário atual
        let totalHorarios = 0;
        let ocupados = 0;

        for (let h = 6; h < 22; h++) {
            for (let m of [0, 30]) {
                const hora = new Date(dataSelecionada);
                hora.setHours(h, m, 0, 0);
                totalHorarios++;

                if (hora < agora) continue; // ignora horários no passado

                const ocupado = agendamentosMedico.some(a => new Date(a.data).getTime() === hora.getTime());
                if (ocupado) {
                    ocupados++;
                } else {
                    const label = hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    horarios.push(`<option value="${hora.toISOString()}">${label}</option>`);
                }
            }
        }

        if (horarios.length === 0) {
            if (dataSelecionada.toDateString() === agora.toDateString()) {
                return "<option value=''>⚠ Nenhum horário disponível hoje</option>";
            } else if (ocupados === totalHorarios) {
                return "<option value=''>⚠ Todos os horários já estão marcados</option>";
            } else {
                return "<option value=''>⚠ Sem horários disponíveis</option>";
            }
        }

        return horarios.join("");
    }

    sub.innerHTML = `
        <!-- Dependências do Flatpickr -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js"></script>

        <div class="card">
            <h3>Adicionar Agendamento</h3>
            <form id="formAgendamento">
                <label>Paciente:</label>
                <select id="pacienteAgendamento" required>
                    <option value="">Selecione o paciente</option>
                    ${optionsPacientes}
                </select>

                <label>Data:</label>
                <input type="text" id="dataAgendamento" required placeholder="Selecione a data">

                <label>Horário:</label>
                <select id="horarioAgendamento" required>
                    <option value="">Selecione a data primeiro</option>
                </select>

                <button type="submit">Salvar</button>
            </form>
            <div id="msgAgendamento"></div>
        </div>
    `;

    // Ativa o calendário Flatpickr
    flatpickr("#dataAgendamento", {
        minDate: "today",
        dateFormat: "d/m/Y",
        locale: "pt",
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                const dataSelecionada = selectedDates[0];
                const horarios = gerarHorariosDisponiveis(dataSelecionada);
                document.getElementById("horarioAgendamento").innerHTML = horarios;
            }
        }
    });

    // Salvando agendamento
    document.getElementById("formAgendamento").addEventListener("submit", function(e){
        e.preventDefault();
        const pacienteLogin = document.getElementById("pacienteAgendamento").value;
        const pacienteObj = pacientes.find(p => p.login === pacienteLogin);
        const data = document.getElementById("horarioAgendamento").value;

        if (!data || !pacienteObj) {
            document.getElementById("msgAgendamento").innerHTML = "<p style='color:red'>⛔ Escolha um horário válido!</p>";
            return;
        }

        let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
        const dataHora = new Date(data);
        const [ano, mes, dia] = dataHora.toISOString().split("T")[0].split("-").map(Number);
        const dataLocal = new Date(ano, mes-1, dia, dataHora.getHours(), dataHora.getMinutes());

        agendamentos.push({ paciente: pacienteObj.nome, data: dataLocal.toISOString(), area: usuario.area, medico: usuario.nome });
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        // Notificação
        notificarConsulta(pacienteObj.login, { medico: usuario.nome, data: new Date(data).toLocaleString("pt-BR") }, true);

        document.getElementById("msgAgendamento").innerHTML = "<p style='color:green'>✅ Agendamento cadastrado!</p>";
        document.getElementById("formAgendamento").reset();
        document.getElementById("horarioAgendamento").innerHTML = "<option value=''>Selecione a data primeiro</option>";
    });
}

function removerAgendamento(index) {
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    if(confirm("Deseja realmente remover este agendamento?")) {
        const agendamento = agendamentos[index];

        const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
        const pacienteObj = pacientes.find(p => p.nome === agendamento.paciente && p.area === agendamento.area);

        agendamentos.splice(index, 1);
        localStorage.setItem("agendamentos", JSON.stringify(agendamentos));

        if(pacienteObj) {
            notificarConsulta(pacienteObj.login, { medico: agendamento.medico, data: new Date(agendamento.data).toLocaleString("pt-BR") }, false);
        }

        verAgendamentos();
    }
}

// -------------------- Calendário --------------------
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
