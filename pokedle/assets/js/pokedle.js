let secretPokemonData = null;
let listaPokemons = [];
let ultimosFiltrados = []; // Necessário para a tecla Tab funcionar

// 1. Tabela de correção para os tipos da 1ª Geração (Removendo Aço, Fada, etc.)
function ajustarTiposGen1(nome, typesOriginais) {
    const correcoesGen1 = {
        'magnemite': [{ slot: 1, type: { name: 'electric' } }],
        'magneton': [{ slot: 1, type: { name: 'electric' } }],
        'clefairy': [{ slot: 1, type: { name: 'normal' } }],
        'clefable': [{ slot: 1, type: { name: 'normal' } }],
        'jigglypuff': [{ slot: 1, type: { name: 'normal' } }],
        'wigglytuff': [{ slot: 1, type: { name: 'normal' } }],
        'mr-mime': [{ slot: 1, type: { name: 'psychic' } }]
    };

    return correcoesGen1[nome] || typesOriginais;
}

// 2. Carrega o Pokémon secreto
async function carregarPokemonSecreto() {
    try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${SECRET_ID}`);
        secretPokemonData = await resposta.json();
    } catch (erro) {
        console.error('Erro ao carregar o Pokémon secreto:', erro);
    }
}

// 3. Carrega sugestões com sprites
async function carregarSugestoes() {
    try {
        const resposta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const dados = await resposta.json();
        
        listaPokemons = dados.results.map(p => {
            const partes = p.url.split('/').filter(Boolean);
            const id = partes[partes.length - 1];
            return {
                name: p.name,
                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            };
        });
    } catch (erro) {
        console.error('Erro ao carregar sugestões:', erro);
    }
}

// Função para recolher os nomes dos Pokémon que já foram chutados (estão na tabela)
function obterPalpitesFeitos() {
    const linhas = document.querySelectorAll('#tabelaPalpites tbody tr');
    const feitos = [];
    linhas.forEach(linha => {
        const textoColuna = linha.cells[0]?.textContent.trim().toLowerCase();
        if (textoColuna) {
            feitos.push(textoColuna);
        }
    });
    return feitos;
}

const input = document.getElementById('pokemonInput');
const sugestoesBox = document.getElementById('sugestoesBox');

// Evento ao digitar no input
input.addEventListener('input', function() {
    const termo = this.value.trim().toLowerCase();
    sugestoesBox.innerHTML = '';

    if (!termo) {
        sugestoesBox.style.display = 'none';
        ultimosFiltrados = [];
        return;
    }

    const palpitesFeitos = obterPalpitesFeitos();

    // Filtra o termo, remove os já chutados e limita a 4 sugestões
    ultimosFiltrados = listaPokemons.filter(p => 
        p.name.includes(termo) && !palpitesFeitos.includes(p.name)
    ).slice(0, 4);

    if (ultimosFiltrados.length === 0) {
        sugestoesBox.style.display = 'none';
        return;
    }

    ultimosFiltrados.forEach(pokemon => {
        const item = document.createElement('a');
        item.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'align-items-center', 'gap-2', 'py-2');
        
        item.innerHTML = `
            <img src="${pokemon.sprite}" width="32" height="32" style="object-fit: contain;">
            <span class="text-capitalize fw-semibold">${pokemon.name}</span>
        `;
        
        item.addEventListener('click', () => {
            input.value = pokemon.name;
            sugestoesBox.style.display = 'none';
            input.focus();
        });

        sugestoesBox.appendChild(item);
    });

    sugestoesBox.style.display = 'block';
});

// Suporte para completar com a tecla Tab
input.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && sugestoesBox.style.display === 'block' && ultimosFiltrados.length > 0) {
        e.preventDefault(); 
        input.value = ultimosFiltrados[0].name; 
        sugestoesBox.style.display = 'none'; 
    }
});

// Fecha a caixa se clicar fora
document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !sugestoesBox.contains(e.target)) {
        sugestoesBox.style.display = 'none';
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    await carregarPokemonSecreto();
    await carregarSugestoes();
});

// 4. Processa o palpite do utilizador
document.getElementById('pokedleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const palpite = input.value.trim().toLowerCase();
    input.value = '';
    sugestoesBox.style.display = 'none';

    if (!secretPokemonData) {
        Swal.fire('Aguarde', 'O jogo ainda está a carregar.', 'info');
        return;
    }

    // Validação: Verifica se o Pokémon já foi tentado antes
    const palpitesFeitos = obterPalpitesFeitos();
    if (palpitesFeitos.includes(palpite)) {
        Swal.fire({
            icon: 'warning',
            title: 'Tentativa repetida!',
            text: `Você já tentou o pokémon "${palpite}". Escolha outro!`
        });
        return;
    }

    try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(palpite)}`);
        if (!resposta.ok) {
            throw new Error('Pokémon não encontrado!');
        }
        const dadosPalpite = await resposta.json();

        const resultado = compararPokemons(dadosPalpite, secretPokemonData);
        adicionarLinhaTabela(resultado);

        if (resultado.venceu) {
            Swal.fire({
                icon: 'success',
                title: 'Parabéns, você acertou!',
                text: `O Pokémon secreto era o ${resultado.name.toUpperCase()}! 🎉`,
                imageUrl: resultado.imagem,
                imageWidth: 120,
                imageHeight: 120,
                imageAlt: resultado.name,
                showCancelButton: true,
                confirmButtonText: '🔄 Novo Pokémon',
                cancelButtonText: 'OK',
                confirmButtonColor: '#198754',
                cancelButtonColor: '#6c757d',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'index.php?novo=1';
                }
            });
            input.disabled = true;
        }
    } catch (erro) {
        Swal.fire('Erro', erro.message, 'error');
    }
});

// 5. Lógica de comparação com filtro Gen 1
function compararPokemons(palpite, secret) {
    const tiposSecretCorrigidos = ajustarTiposGen1(secret.name, secret.types);
    const tiposPalpiteCorrigidos = ajustarTiposGen1(palpite.name, palpite.types);

    const sTipo1 = tiposSecretCorrigidos.find(t => t.slot === 1)?.type.name || '';
    const sTipo2 = tiposSecretCorrigidos.find(t => t.slot === 2)?.type.name || '';

    const pTipo1 = tiposPalpiteCorrigidos.find(t => t.slot === 1)?.type.name || '';
    const pTipo2 = tiposPalpiteCorrigidos.find(t => t.slot === 2)?.type.name || '';

    const secretTypesList = [sTipo1, sTipo2].filter(Boolean);

    let statusTipo1 = 'errado';
    if (pTipo1 === sTipo1) {
        statusTipo1 = 'correto';
    } else if (secretTypesList.includes(pTipo1)) {
        statusTipo1 = 'parcial';
    }

    let statusTipo2 = 'errado';
    if (pTipo2 && sTipo2 && pTipo2 === sTipo2) {
        statusTipo2 = 'correto';
    } else if (pTipo2 && secretTypesList.includes(pTipo2)) {
        statusTipo2 = 'parcial';
    } else if (!pTipo2 && !sTipo2) {
        statusTipo2 = 'correto';
    }

    const alturaStatus = palpite.height === secret.height ? 'correto' : (palpite.height < secret.height ? 'maior' : 'menor');
    const pesoStatus = palpite.weight === secret.weight ? 'correto' : (palpite.weight < secret.weight ? 'maior' : 'menor');

    return {
        name: palpite.name,
        imagem: palpite.sprites.front_default,
        tipo1: { nome: pTipo1, status: statusTipo1 },
        tipo2: { nome: pTipo2, status: statusTipo2 },
        altura: alturaStatus,
        peso: pesoStatus,
        venceu: palpite.name === secret.name
    };
}

// 6. Desenha a linha na tabela
function adicionarLinhaTabela(dados) {
    const tbody = document.querySelector('#tabelaPalpites tbody');
    const tr = document.createElement('tr');

    function formatarTipo(tipoObj) {
        if (!tipoObj.nome) return { texto: '-', cor: '#6c757d' };
        let cor = '#dc3545';
        if (tipoObj.status === 'correto') cor = '#198754';
        else if (tipoObj.status === 'parcial') cor = '#ffc107';
        return { texto: tipoObj.nome.toUpperCase(), cor };
    }

    const t1 = formatarTipo(dados.tipo1);
    const t2 = formatarTipo(dados.tipo2);

    const setaAltura = dados.altura === 'maior' ? '⬆️ Maior' : (dados.altura === 'menor' ? '⬇️ Menor' : '✅ Correto');
    const corAltura = dados.altura === 'correto' ? '#198754' : '#dc3545';

    const setaPeso = dados.peso === 'maior' ? '⬆️ Mais pesado' : (dados.peso === 'menor' ? '⬇️ Mais leve' : '✅ Correto');
    const corPeso = dados.peso === 'correto' ? '#198754' : '#dc3545';

    tr.innerHTML = `
        <td>
            <img src="${dados.imagem}" width="50"><br>
            <strong class="text-capitalize">${dados.name}</strong>
        </td>
        <td style="background-color: ${t1.cor}; color: white; font-weight: bold;">
            ${t1.texto}
        </td>
        <td style="background-color: ${t2.cor}; color: white; font-weight: bold;">
            ${t2.texto}
        </td>
        <td style="background-color: ${corAltura}; color: white; font-weight: bold;">
            ${setaAltura}
        </td>
        <td style="background-color: ${corPeso}; color: white; font-weight: bold;">
            ${setaPeso}
        </td>
    `;

    tbody.prepend(tr);
}




/*let secretPokemonData = null;
let palpitesFeitos = []; // Array para guardar os nomes já chutados

// 1. Carrega o Pokémon secreto
async function carregarPokemonSecreto() {
    try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${SECRET_ID}`);
        secretPokemonData = await resposta.json();
    } catch (erro) {
        console.error('Erro ao carregar o Pokémon secreto:', erro);
    }
}

// 2. Carrega sugestões no datalist
let listaPokemons = [];

async function carregarSugestoes() {
    try {
        const resposta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const dados = await resposta.json();
        
        listaPokemons = dados.results.map(p => {
            const partes = p.url.split('/').filter(Boolean);
            const id = partes[partes.length - 1];
            return {
                name: p.name,
                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            };
        });
    } catch (erro) {
        console.error('Erro ao carregar sugestões:', erro);
    }
}

// Função para recolher os nomes dos Pokémon que já foram chutados (estão na tabela)
function obterPalpitesFeitos() {
    const linhas = document.querySelectorAll('#tabelaPalpites tbody tr');
    const feitos = [];
    linhas.forEach(linha => {
        // Assume que o nome do Pokémon está na primeira coluna da tabela
        const textoColuna = linha.cells[0]?.textContent.trim().toLowerCase();
        if (textoColuna) {
            feitos.push(textoColuna);
        }
    });
    return feitos;
}

const input = document.getElementById('pokemonInput');
const sugestoesBox = document.getElementById('sugestoesBox');

input.addEventListener('input', function() {
    const termo = this.value.trim().toLowerCase();
    sugestoesBox.innerHTML = '';

    if (!termo) {
        sugestoesBox.style.display = 'none';
        return;
    }

    // Pega a lista de Pokémon já tentados
    const palpitesFeitos = obterPalpitesFeitos();

    // Filtra o termo e remove os que já foram chutados
    const filtrados = listaPokemons.filter(p => 
        p.name.includes(termo) && !palpitesFeitos.includes(p.name)
    ).slice(0, 4);

    if (filtrados.length === 0) {
        sugestoesBox.style.display = 'none';
        return;
    }

    filtrados.forEach(pokemon => {
        const item = document.createElement('a');
        item.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'align-items-center', 'gap-2', 'py-2');
        
        item.innerHTML = `
            <img src="${pokemon.sprite}" width="32" height="32" style="object-fit: contain;">
            <span class="text-capitalize fw-semibold">${pokemon.name}</span>
        `;
        
        item.addEventListener('click', () => {
            input.value = pokemon.name;
            sugestoesBox.style.display = 'none';
            input.focus();
        });

        sugestoesBox.appendChild(item);
    });

    sugestoesBox.style.display = 'block';
});

// Fecha a caixa se clicar fora
document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !sugestoesBox.contains(e.target)) {
        sugestoesBox.style.display = 'none';
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    await carregarPokemonSecreto();
    await carregarSugestoes();
});

// 3. Processa o palpite do utilizador com validação de repetidos
document.getElementById('pokedleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = document.getElementById('pokemonInput');
    const palpite = input.value.trim().toLowerCase();
    input.value = '';

    if (!secretPokemonData) {
        Swal.fire('Aguarde', 'O jogo ainda está a carregar.', 'info');
        return;
    }

    // Validação: Verifica se o Pokémon já foi tentado antes
    if (palpitesFeitos.includes(palpite)) {
        Swal.fire({
            icon: 'warning',
            title: 'Tentativa repetida!',
            text: `Você já tentou o pokémon "${palpite}". Escolha outro!`
        });
        return;
    }

    try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(palpite)}`);
        if (!resposta.ok) {
            throw new Error('Pokémon não encontrado!');
        }
        const dadosPalpite = await resposta.json();

        // Adiciona à lista de palpites já feitos
        palpitesFeitos.push(palpite);

        const resultado = compararPokemons(dadosPalpite, secretPokemonData);
        adicionarLinhaTabela(resultado);

        if (resultado.venceu) {
            Swal.fire({
                icon: 'success',
                title: 'Parabéns, você acertou!',
                text: `O Pokémon secreto era o ${resultado.name.toUpperCase()}! 🎉`,
                imageUrl: resultado.imagem,
                imageWidth: 120,
                imageHeight: 120,
                imageAlt: resultado.name,
                showCancelButton: true,          // Ativa o segundo botão (OK / Cancelar)
                confirmButtonText: '🔄 Novo Pokémon', // Botão principal
                cancelButtonText: 'OK',           // Botão secundário
                confirmButtonColor: '#198754',    // Cor verde para novo jogo
                cancelButtonColor: '#6c757d',     // Cor cinzenta para o OK
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Se clicar em "Novo Pokémon"
                    window.location.href = 'index.php?novo=1';
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // Se clicar em "OK", apenas fecha o alerta e mantém a tabela visível
                }
            });
            input.disabled = true;
        }
    } catch (erro) {
        Swal.fire('Erro', erro.message, 'error');
    }
});

// Lógica de comparação
// Lógica de comparação atualizada com Tipo 1 e Tipo 2 separados
function compararPokemons(palpite, secret) {
    const sTipo1 = secret.types.find(t => t.slot === 1)?.type.name || '';
    const sTipo2 = secret.types.find(t => t.slot === 2)?.type.name || '';

    const pTipo1 = palpite.types.find(t => t.slot === 1)?.type.name || '';
    const pTipo2 = palpite.types.find(t => t.slot === 2)?.type.name || '';

    const secretTypesList = [sTipo1, sTipo2].filter(Boolean);

    // Avaliação do Tipo 1
    let statusTipo1 = 'errado';
    if (pTipo1 === sTipo1) {
        statusTipo1 = 'correto';
    } else if (secretTypesList.includes(pTipo1)) {
        statusTipo1 = 'parcial';
    }

    // Avaliação do Tipo 2
    let statusTipo2 = 'errado';
    if (pTipo2 && sTipo2 && pTipo2 === sTipo2) {
        statusTipo2 = 'correto';
    } else if (pTipo2 && secretTypesList.includes(pTipo2)) {
        statusTipo2 = 'parcial';
    } else if (!pTipo2 && !sTipo2) {
        statusTipo2 = 'correto'; // Nenhum dos dois tem segundo tipo
    }

    const alturaStatus = palpite.height === secret.height ? 'correto' : (palpite.height < secret.height ? 'maior' : 'menor');
    const pesoStatus = palpite.weight === secret.weight ? 'correto' : (palpite.weight < secret.weight ? 'maior' : 'menor');

    return {
        name: palpite.name,
        imagem: palpite.sprites.front_default,
        tipo1: { nome: pTipo1, status: statusTipo1 },
        tipo2: { nome: pTipo2, status: statusTipo2 },
        altura: alturaStatus,
        peso: pesoStatus,
        venceu: palpite.name === secret.name
    };
}

// Desenha a linha na tabela com as duas colunas de tipo
function adicionarLinhaTabela(dados) {
    const tbody = document.querySelector('#tabelaPalpites tbody');
    const tr = document.createElement('tr');

    function formatarTipo(tipoObj) {
        if (!tipoObj.nome) return { texto: '-', cor: '#6c757d' }; // Cinzento se não tiver 2º tipo
        let cor = '#dc3545'; // Vermelho (errado)
        if (tipoObj.status === 'correto') cor = '#198754';     // Verde (correto)
        else if (tipoObj.status === 'parcial') cor = '#ffc107'; // Amarelo (parcial)
        return { texto: tipoObj.nome.toUpperCase(), cor };
    }

    const t1 = formatarTipo(dados.tipo1);
    const t2 = formatarTipo(dados.tipo2);

    const setaAltura = dados.altura === 'maior' ? '⬆️ Maior' : (dados.altura === 'menor' ? '⬇️ Menor' : '✅ Correto');
    const corAltura = dados.altura === 'correto' ? '#198754' : '#dc3545';

    const setaPeso = dados.peso === 'maior' ? '⬆️ Mais pesado' : (dados.peso === 'menor' ? '⬇️ Mais leve' : '✅ Correto');
    const corPeso = dados.peso === 'correto' ? '#198754' : '#dc3545';

    tr.innerHTML = `
        <td>
            <img src="${dados.imagem}" width="50"><br>
            <strong class="text-capitalize">${dados.name}</strong>
        </td>
        <td style="background-color: ${t1.cor}; color: white; font-weight: bold;">
            ${t1.texto}
        </td>
        <td style="background-color: ${t2.cor}; color: white; font-weight: bold;">
            ${t2.texto}
        </td>
        <td style="background-color: ${corAltura}; color: white; font-weight: bold;">
            ${setaAltura}
        </td>
        <td style="background-color: ${corPeso}; color: white; font-weight: bold;">
            ${setaPeso}
        </td>
    `;

    tbody.prepend(tr);
}
*/