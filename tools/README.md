# CurriculoWeb

Site de curriculo/portfolio estatico com conteudo dirigido por dados. O projeto usa `data.json` como fonte principal e gera dois artefatos a partir dele:

- `assets/js/data.js`: objeto consumido pelo frontend no navegador
- `curriculo.pdf`: versao em PDF do curriculo

## Visao Geral

O site eh uma pagina unica com secoes de apresentacao, perfil, indicadores, servicos, status atual, curriculo e contato.

O fluxo de dados funciona assim:

1. Voce edita `data.json`
2. O script `tools/sync_site_data.py` atualiza `assets/js/data.js`
3. O mesmo script regenera `curriculo.pdf`
4. O frontend carrega `window.siteData` em `assets/js/data.js`
5. `assets/js/loader.js` injeta esse conteudo no HTML

## Estrutura

```text
.
├── index.html
├── data.json
├── curriculo.pdf
├── assets/
│   ├── bootstrap/
│   ├── css/
│   ├── images/
│   └── js/
└── tools/
    └── sync_site_data.py
```

Arquivos principais:

- `index.html`: estrutura da pagina
- `data.json`: fonte de dados principal do site
- `assets/js/data.js`: versao gerada para o navegador
- `assets/js/loader.js`: popula a interface com os dados
- `assets/js/custom.js`: interacoes visuais e comportamento da pagina
- `assets/css/style.css`: estilo principal
- `tools/sync_site_data.py`: sincroniza dados e gera o PDF

## Dependencias

### Para o site

O frontend usa bibliotecas ja commitadas no projeto:

- Bootstrap
- jQuery
- WOW.js
- Owl Carousel
- Magnific Popup
- FitVids
- Simple Text Rotator
- Font Awesome via CDN

Nao ha processo de build com `npm`, `yarn` ou `vite`.

### Para o script Python

O script usa apenas a biblioteca padrao do Python:

- `json`
- `re`
- `textwrap`
- `copy`
- `datetime`
- `pathlib`

Requisito:

- Python 3

Nao eh necessario instalar pacotes com `pip`.

## Como executar localmente

Como o projeto eh estatico, basta servir a pasta por um servidor HTTP simples.

Exemplo com Python:

```bash
python3 -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

## Como editar o conteudo

Edite o arquivo:

```text
data.json
```

Nele ficam:

- textos da home
- links da navbar
- foto e bio
- skills
- redes profissionais
- servicos
- experiencia e formacao
- contatos
- traducoes

## Script `sync_site_data.py`

O script fica em [tools/sync_site_data.py](/home/wesley/clientes/wmanti/curriculoweb/tools/sync_site_data.py).

### O que ele faz

Quando executado, ele:

1. Le `data.json`
2. Garante que `resume.cv_download_url` aponte para `curriculo.pdf`
3. Gera `assets/js/data.js` com `window.siteData = ...`
4. Gera o arquivo `curriculo.pdf`

### Como executar

Rode na raiz do projeto:

```bash
python3 tools/sync_site_data.py
```

Saida esperada:

```text
Updated assets/js/data.js and curriculo.pdf
```

### Quando executar

Execute o script sempre que alterar:

- `data.json`
- dados de experiencia
- dados de formacao
- bio
- contatos
- links do curriculo
- traducoes que impactem o conteudo exportado

### Arquivos alterados pelo script

- `assets/js/data.js`
- `curriculo.pdf`

## Fluxo recomendado de manutencao

1. Edite `data.json`
2. Rode `python3 tools/sync_site_data.py`
3. Recarregue o site no navegador
4. Verifique se `assets/js/data.js` e `curriculo.pdf` foram atualizados
5. So depois faca commit

## Observacoes

- `assets/js/data.js` eh arquivo gerado. A fonte de verdade deve continuar sendo `data.json`.
- O PDF tambem eh gerado. Evite editar `curriculo.pdf` manualmente.
- As imagens do perfil ficam em `assets/images/`.
- Se adicionar imagens vindas do Windows com arquivos `:Zone.Identifier`, remova esses metadados antes de versionar.

## Exemplo rapido

Depois de mudar sua bio ou experiencia:

```bash
python3 tools/sync_site_data.py
python3 -m http.server 8000
```

Depois abra o site e confira:

- secao `Perfil`
- secao `Curriculum`
- link de download do PDF
