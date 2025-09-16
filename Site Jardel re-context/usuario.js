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
                        ${agendamentos.map(a => {
                            const data = new Date(a.data).toLocaleString("pt-BR");
                            return `<li>${data} - Dr(a). ${a.medico}</li>`;
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
                        const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
                        const agMedico = agendamentos.filter(a => a.medico === m.nome);

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

            // Ignora horários passados somente se for hoje
            if (dataHoraTemp <= agora && dataHoraTemp.toDateString() === agora.toDateString()) continue;

            // Verifica se horário já está ocupado
            const ocupado = agMedico.some(a => {
                const agData = new Date(a.data);
                return agData.getTime() === dataHoraTemp.getTime();
            });

            if (!ocupado) horarios.push(`${("0"+h).slice(-2)}:${("0"+mnt).slice(-2)}`);
        }
    }

    select.innerHTML = horarios.length
        ? horarios.map(h => `<option value="${h}">${h}</option>`).join("")
        : "<option value=''>Sem horários disponíveis</option>";
}


// -------------------- Salvar Agendamento --------------------
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

    // cria a data completa com hora e minuto da seleção
    const [h, mnt] = horaInput.split(":");
    const dataHora = new Date(dataInput);
    dataHora.setHours(parseInt(h), parseInt(mnt), 0, 0);

    // verifica se já existe conflito
    const conflito = agendamentos.some(a => a.medico === nomeMedico && new Date(a.data).getTime() === dataHora.getTime());
    if(conflito){
        alert("Este horário já está ocupado. Escolha outro.");
        return;
    }

    // salva o agendamento
    agendamentos.push({
        paciente: usuario.nome,
        data: dataHora.toISOString(),
        medico: nomeMedico,
        area: usuario.area || "Geral"
    });

    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    alert(`Consulta agendada com Dr(a). ${nomeMedico} em ${dataHora.toLocaleString("pt-BR")}`);

    // atualiza a lista de médicos e os horários disponíveis
    carregarConteudoPaciente('medicos');
}
