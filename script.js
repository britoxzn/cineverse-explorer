// 1. CONFIGURAÇÕES TÉCNICAS
const API_KEY = 'f91d57afedb87608cb1bb2e3a1496302'; // <--- COLE SUA CHAVE AQUI
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// 2. FUNÇÕES DE UTILIDADE (LOADER E NOTIFICAÇÃO)
function mostrarLoader() {
    const loader = document.getElementById('loader');
    const grade = document.getElementById('grade-filmes');
    if (loader) loader.style.display = 'flex';
    if (grade) grade.innerHTML = ''; 
}

function esconderLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

function mostrarNotificacao(mensagem) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerHTML = `<span>❤️</span> ${mensagem}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// 3. FUNÇÕES DE CARREGAMENTO DE DADOS
async function carregarFilmesPopulares() {
    mostrarLoader();
    document.getElementById('titulo-secao').innerText = " Filmes em Alta";

    try {
        const resposta = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=pt-BR`);
        const dados = await resposta.json();
        esconderLoader();

        dados.results.forEach(filme => {
            if (filme.poster_path) criarCartaoFilme(filme);
        });
    } catch (erro) {
        esconderLoader();
        console.error("Erro ao carregar populares:", erro);
    }
}

async function buscarFilmes() {
    const termo = document.getElementById('busca').value;
    const grade = document.getElementById('grade-filmes');

    if (termo === '') return;

    mostrarLoader();
    document.getElementById('titulo-secao').innerText = `Resultados para: ${termo}`;

    try {
        const resposta = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${termo}&language=pt-BR`);
        const dados = await resposta.json();
        esconderLoader();

        if (dados.results.length === 0) {
            grade.innerHTML = '<p class="empty-state">Nenhum filme encontrado para essa busca.</p>';
            return;
        }

        dados.results.forEach(filme => {
            if (filme.poster_path) criarCartaoFilme(filme);
        });
    } catch (erro) {
        esconderLoader();
        console.error("Erro na busca:", erro);
    }
}

// 4. CRIAÇÃO DE ELEMENTOS VISUAIS
function criarCartaoFilme(filme) {
    const grade = document.getElementById('grade-filmes');
    const cartao = document.createElement('div');
    cartao.classList.add('movie-card');

    const favoritos = JSON.parse(localStorage.getItem('cineverse_favoritos')) || [];
    const ehFavorito = favoritos.some(f => f.id === filme.id);
    const classeCoracao = ehFavorito ? 'ativo' : '';
    const filmeString = JSON.stringify(filme).replace(/"/g, '&quot;');

    cartao.innerHTML = `
        <img src="${IMAGE_URL}${filme.poster_path}" alt="${filme.title}" onclick="abrirDetalhes(${filme.id})">
        <button class="btn-favorito ${classeCoracao}" onclick="favoritarFilme(${filmeString})">
            ♥
        </button>
        <div class="movie-info" onclick="abrirDetalhes(${filme.id})">
            <h3>${filme.title}</h3>
            <span>⭐ ${filme.vote_average.toFixed(1)}</span>
        </div>
    `;
    grade.appendChild(cartao);
}

// 5. LÓGICA DE FAVORITOS E MODAL
function favoritarFilme(filme) {
    let favoritos = JSON.parse(localStorage.getItem('cineverse_favoritos')) || [];
    const index = favoritos.findIndex(f => f.id === filme.id);

    if (index !== -1) {
        favoritos.splice(index, 1);
        mostrarNotificacao(`Removido: ${filme.title}`);
    } else {
        favoritos.push(filme);
        mostrarNotificacao(`Adicionado: ${filme.title}`);
    }

    localStorage.setItem('cineverse_favoritos', JSON.stringify(favoritos));
    
    // Atualiza a visualização dependendo de onde o usuário está
    const tituloAtual = document.getElementById('titulo-secao').innerText;
    if (tituloAtual === ' Meus Favoritos') {
        carregarFavoritos();
    } else {
        // Apenas atualiza o ícone visual sem recarregar tudo
        const botoes = document.querySelectorAll('.btn-favorito');
        // (Opcional: lógica para trocar a classe do botão clicado)
    }
}

function carregarFavoritos() {
    const grade = document.getElementById('grade-filmes');
    const favoritos = JSON.parse(localStorage.getItem('cineverse_favoritos')) || [];

    document.getElementById('titulo-secao').innerText = 'Meus Favoritos';
    grade.innerHTML = '';

    if (favoritos.length === 0) {
        grade.innerHTML = '<p class="empty-state">Sua lista de favoritos está vazia.</p>';
        return;
    }

    favoritos.forEach(filme => criarCartaoFilme(filme));
}

async function abrirDetalhes(id) {
    const modal = document.getElementById('modal-detalhes');
    const conteudo = document.getElementById('conteudo-modal');
    
    modal.style.display = 'block';
    conteudo.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    try {
        const resposta = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=pt-BR`);
        const filme = await resposta.json();

        conteudo.innerHTML = `
            <div class="detalhes-flex">
                <img src="${IMAGE_URL}${filme.poster_path}" alt="${filme.title}">
                <div class="info-texto">
                    <h2>${filme.title}</h2>
                    <p><strong>Sinopse:</strong> ${filme.overview || 'Sinopse não disponível.'}</p>
                    <div class="tags-info">
                        <span>📅 ${filme.release_date.split('-').reverse().join('/')}</span>
                        <span>⏱️ ${filme.runtime} min</span>
                        <span>⭐ ${filme.vote_average.toFixed(1)}</span>
                    </div>
                    <div class="tags-info" style="margin-top: 10px;">
                        ${filme.genres.map(g => `<span>🎭 ${g.name}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (erro) {
        conteudo.innerHTML = '<p>Erro ao carregar detalhes.</p>';
    }
}

// 6. EVENTOS DE CONTROLE
function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

function limparBusca() {
    document.getElementById('busca').value = '';
    carregarFilmesPopulares();
}

// Fechar modal ao clicar fora dele
window.onclick = (event) => {
    const modal = document.getElementById('modal-detalhes');
    if (event.target == modal) fecharModal();
};

// Pesquisa ao apertar Enter
document.getElementById('busca').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarFilmes();
});

// Modifique a função window.onload para incluir o sumiço da logo
window.onload = async () => {
    // 1. Inicia o carregamento dos filmes populares
    await carregarFilmesPopulares();

    // 2. Após os filmes carregarem, espera um pequeno tempo para o usuário apreciar a logo
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.classList.add('hidden'); // Adiciona a classe que faz o fade-out
    }, 2000); // 2 segundos de exibição
};