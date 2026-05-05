// Sensor simulation data
const API_KEY = '03b273bb11c049c9b1205155262402'; // Cole aqui o código que você pegou no OpenWeatherMap
const CIDADE = 'Engenheiro Coelho'; // Cidade do UNASP [cite: 1]

// Função que busca os dados e decide a irrigação
async function atualizarPrevisao() {
    try {
        // Usando proxy para evitar CORS
        const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CIDADE}&aqi=no&lang=pt`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const dados = await response.json();
        exibirPrevisaoWeatherAPI(dados);
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar previsão:', erro);
        document.getElementById('weatherInfo').innerHTML = '<p style="color: #ff6b6b; font-weight: bold;">⚠️ Erro ao carregar previsão do tempo. Verifique sua conexão.</p>';
    }
}

// Função para exibir dados da previsão na página
function exibirPrevisao(dados) {
    const temp = Math.round(dados.main.temp);
    const descricao = dados.weather[0].description;
    const umidade = dados.main.humidity;
    const velocidadeVento = dados.wind.speed;
    const cidade = dados.name;
    
    const html = `
        <div class="weather-card">
            <h4>${cidade}</h4>
            <div class="weather-main">
                <span class="temperature">${temp}°C</span>
                <span class="description">${descricao.charAt(0).toUpperCase() + descricao.slice(1)}</span>
            </div>
            <div class="weather-details">
                <div class="weather-item">
                    <span class="label">Umidade:</span>
                    <span class="value">${umidade}%</span>
                </div>
                <div class="weather-item">
                    <span class="label">Vento:</span>
                    <span class="value">${velocidadeVento.toFixed(1)} m/s</span>
                </div>
            </div>
            <div class="irrigation-tip">
                ${gerarDicaIrrigacao(temp, umidade, velocidadeVento)}
            </div>
        </div>
    `;
    
    document.getElementById('weatherInfo').innerHTML = html;
}

// Função para exibir dados da WeatherAPI.com
function exibirPrevisaoWeatherAPI(dados) {
    const temp = Math.round(dados.current.temp_c);
    const descricao = dados.current.condition.text;
    const umidade = dados.current.humidity;
    const velocidadeVento = dados.current.wind_kph / 3.6; // Converter km/h para m/s
    const cidade = dados.location.name;
    
    const html = `
        <div class="weather-card">
            <h4>🌍 ${cidade}</h4>
            <div class="weather-main">
                <span class="temperature">${temp}°C</span>
                <span class="description">${descricao}</span>
            </div>
            <div class="weather-details">
                <div class="weather-item">
                    <span class="label">💧 Umidade:</span>
                    <span class="value">${umidade}%</span>
                </div>
                <div class="weather-item">
                    <span class="label">💨 Vento:</span>
                    <span class="value">${velocidadeVento.toFixed(1)} m/s</span>
                </div>
            </div>
            <div class="irrigation-tip">
                ${gerarDicaIrrigacao(temp, umidade, velocidadeVento)}
            </div>
        </div>
    `;
    
    document.getElementById('weatherInfo').innerHTML = html;
}

// Função para gerar dica de irrigação baseada no tempo
function gerarDicaIrrigacao(temp, umidade, vento) {
    let dica = '📋 <strong>Recomendação:</strong> ';
    
    if (umidade > 80) {
        dica += 'Umidade alta. Reduza irrigação para evitar excesso de água.';
    } else if (umidade < 50) {
        dica += 'Umidade baixa. Aumente a frequência de irrigação.';
    } else {
        dica += 'Condições normais. Mantenha irrigação regular.';
    }
    
    if (temp > 30) {
        dica += ' 🌞 Dia quente: aumente a hidratação das plantas.';
    } else if (temp < 15) {
        dica += ' ❄️ Dia/Noite fria: reduza irrigação para evitar apodrecimento.';
    }
    
    if (vento > 5) {
        dica += ' 💨 Vento forte: aumento de evaporação detectado.';
    }
    
    return dica;
}
let sensorData = {
    sensor1: 65,  // Soil humidity 1
    sensor2: 72,  // Soil humidity 2
    sensor3: 28,  // Temperature
    sensor4: 55   // Air humidity
};

let pumpStatus = false;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    updateSensors();
    setupPumpControl();
    atualizarPrevisao();
    
    // Simulate sensor updates every 5 seconds
    setInterval(updateSensors, 5000);
    
    // Update weather every 10 minutes (600000 ms)
    setInterval(atualizarPrevisao, 600000);
});

// Update sensor display values
function updateSensors() {
    // Simulate sensor readings with slight variations
    sensorData.sensor1 = Math.max(30, Math.min(90, sensorData.sensor1 + (Math.random() - 0.5) * 10));
    sensorData.sensor2 = Math.max(30, Math.min(90, sensorData.sensor2 + (Math.random() - 0.5) * 10));
    sensorData.sensor3 = Math.max(15, Math.min(40, sensorData.sensor3 + (Math.random() - 0.5) * 3));
    sensorData.sensor4 = Math.max(30, Math.min(95, sensorData.sensor4 + (Math.random() - 0.5) * 8));

    // Update DOM elements
    document.getElementById('sensor1').textContent = Math.round(sensorData.sensor1);
    document.getElementById('sensor2').textContent = Math.round(sensorData.sensor2);
    document.getElementById('sensor3').textContent = Math.round(sensorData.sensor3);
    document.getElementById('sensor4').textContent = Math.round(sensorData.sensor4);

    // Update sensor status based on ideal ranges
    updateSensorStatus('sensor1', sensorData.sensor1, 60, 80);
    updateSensorStatus('sensor2', sensorData.sensor2, 60, 80);
    updateSensorStatus('sensor3', sensorData.sensor3, 20, 30);
    updateSensorStatus('sensor4', sensorData.sensor4, 40, 70);

    // Auto-trigger pump if soil humidity is below 50%
    if (sensorData.sensor1 < 50 || sensorData.sensor2 < 50) {
        if (!pumpStatus) {
            togglePump();
        }
    } else if (sensorData.sensor1 > 80 && sensorData.sensor2 > 80 && pumpStatus) {
        togglePump();
    }
}

// Update individual sensor status
function updateSensorStatus(sensorId, value, min, max) {
    const statusElement = document.getElementById(`status${sensorId.replace('sensor', '')}`);
    let status = '';
    let className = '';

    if (value >= min && value <= max) {
        status = 'Ótimo';
        className = 'optimal';
    } else if (value < min) {
        status = 'Muito Baixo';
        className = 'low';
    } else {
        status = 'Muito Alto';
        className = 'high';
    }

    statusElement.textContent = status;
    statusElement.className = `sensor-status ${className}`;
}

// Setup pump control button
function setupPumpControl() {
    const pumpButton = document.getElementById('pump-toggle');
    pumpButton.addEventListener('click', togglePump);
}

// Toggle pump on/off
function togglePump() {
    pumpStatus = !pumpStatus;
    
    const button = document.getElementById('pump-toggle');
    const indicator = document.getElementById('pump-indicator');
    const statusText = document.getElementById('pump-status-text');

    if (pumpStatus) {
        button.textContent = 'Desligar Bomba';
        button.classList.add('active');
        indicator.classList.add('active');
        statusText.textContent = 'Bomba: LIGADA';
        console.log('Bomba ligada - Iniciando irrigação');
    } else {
        button.textContent = 'Ligar Bomba';
        button.classList.remove('active');
        indicator.classList.remove('active');
        statusText.textContent = 'Bomba: DESLIGADA';
        console.log('Bomba desligada');
    }
}

// Log sensor data to console for debugging
function logSensorData() {
    console.log('Dados dos Sensores:', sensorData);
    console.log('Status da Bomba:', pumpStatus ? 'LIGADA' : 'DESLIGADA');
}

// Export for testing
window.sensorData = sensorData;
window.togglePump = togglePump;
window.logSensorData = logSensorData;

async function carregarDadosFazenda() {
    try {
        const response = await fetch('http://localhost:3000/api/fazendas');
        const fazendas = await response.json();
        
        if (fazendas.length > 0) {
            // Atualiza o título ou algum campo com o nome da fazenda real
            console.log("Fazenda conectada:", fazendas[0].nome_fazenda);
            // Se tiver um elemento com ID 'nomeFazenda', ele preenche:
            // document.getElementById('nomeFazenda').innerText = fazendas[0].nome_fazenda;
        }
    } catch (error) {
        console.error("Erro ao carregar dados do banco:", error);
    }
}

// Chama a função ao carregar a página
carregarDadosFazenda();


// Verifica autenticação e carrega o dashboard
window.onload = async function() {
    const nomeUsuario = localStorage.getItem('usuarioNome');
    if (!nomeUsuario) {
        // Sem sessão ativa: redireciona para o login
        window.location.href = 'login.html';
        return;
    }

    console.log("Bem-vindo, " + nomeUsuario);

    try {
        const response = await fetch('http://localhost:5000/api/fazenda-status');
        const dados = await response.json();

        const tituloFazenda = document.querySelector('h1');
        if (tituloFazenda) tituloFazenda.innerText = "Monitorando: " + dados.nome_fazenda;

        const statusBomba = document.getElementById('pumpStatus');
        if (statusBomba) {
            statusBomba.innerText = dados.status_on_off ? "Ligada" : "Desligada";
            statusBomba.className = dados.status_on_off ? "status-indicator on" : "status-indicator off";
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
    }
};