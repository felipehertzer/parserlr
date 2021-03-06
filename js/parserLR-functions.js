$(document).ready(function () {

    // Executado quando gramática é informada e botão de "Montar Tabela" é pressionado
    $("#monta-tabela").on("click", function () {
        // Oculta áreas de resultados
        $("#first-follow").hide();
        $("#table").hide();
        $("#output").hide();

        // Transforma informações dos formulário em um objeto
        var gramatica = $('form').serializeObject();

        // Verifica se formulário está com erro ou se NT, T e produções foram inseridas
        if ($("#status div").hasClass("alert-danger") || !gramatica["naoTerminais"] || !gramatica["terminais"] || !gramatica["producoes"]) {
            // Exibe mensagem de erro
            $("#status").html("<div class='alert alert-danger' role='alert'><strong>Gramática Inválida!</strong><br>Verifique antes de prosseguir!</div>");
        }
        // Senão prossegue com geração da tabela
        else {
            // Formata os NT e símbolo de início para caixa alta
            gramatica["naoTerminais"] = gramatica["naoTerminais"].toUpperCase();
            gramatica["simboloInicio"] = gramatica["simboloInicio"].toUpperCase();

            // Transforma strings de NT e T em arrays
            gramatica["naoTerminais"] = gramatica["naoTerminais"].replace(/\s/g, '').split(",");
            gramatica["terminais"] = gramatica["terminais"].replace(/\s/g, '').split(",");
            
            // Separa produções de um mesmo NT, que estão na mesma linha, em linhas diferentes
            gramatica = separaProducoes(gramatica);

            // Busca de follows dos NTs da gramática informada
            var follows = buscaFirstFollow(gramatica);
            
            // Construção da tabela utilizada na verificação
            construcaoTabelaSLR(gramatica, follows);
        }

    });

    // Executado quando sentença é informada e botão de "Analisar" é pressionado
    $("#analisar").on("click", function () {

        // Busca dados armazenados nas variáveis de sessão do navegador
        var arrayResolvidos = JSON.parse(sessionStorage.getItem('resolvidos'));
        var arrayAcao = JSON.parse(sessionStorage.getItem('acoes'));
        var arrayDesvio = JSON.parse(sessionStorage.getItem('desvios'));
        var gramatica = JSON.parse(sessionStorage.getItem('gramatica'));

        // Chamada de função que realiza análise de sentença informada e retorna estrutura da tabela para ser exibida
        var html = construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica, arrayResolvidos);

        $("#output").css("display", "block");
        $(".saida").html(html);

        $('html,body').animate({ scrollTop: $("#output").offset().top }, 'slow');
    });

    /*********************** FUNÇÕES DE FIRST E FOLLOW ***********************/

    // Fluxo de busca de firsts e follows
    function buscaFirstFollow(gramatica) {
        //Inicializa array do first e follow no objeto gramatica
        var first = [];  
        var follow = [];
        for(var j = 0; j < gramatica.naoTerminais.length; j++){
            first[j] = {};
            first[j].NT = gramatica.naoTerminais[j];
            first[j].first = '';
            follow[j] = {};
            follow[j].NT = gramatica.naoTerminais[j];
            if(gramatica.naoTerminais[j] === gramatica.simboloInicio){
                follow[j].follow = '$';
            } else {
                follow[j].follow = '';
            }
            
        }
        //Percorre produções, gerando o first do não terminal em cada iteração
        for (var i = (gramatica.producoes.length - 1); i >= 0; i--) {
            first = buscaFirst(gramatica, first, gramatica.producoes[i].naoTerminais, gramatica.producoes[i].complemento);
        }
        //Chama função que percorre as produções, gerando o follow dos terminais
        follow = buscaFollow(gramatica, follow, first);

        return follow;
    }

    var controlNullFollow = [];

    // Busca os follows da gramática
    function buscaFollow(gramatica, follow, first) {
        for(var t = 0; t < gramatica.naoTerminais.length; t++){
            for(var q = 0; q < gramatica.producoes.length; q++){
                if(gramatica.producoes[q].complemento.indexOf(follow[t].NT) > -1){
                    //Transforma a sentença analisada em um array
                    var complementoArray = gramatica.producoes[q].complemento.split(" ");
                    //Posição que o elemento se encontra dentro da sentença analisada
                    var indexComplemento = complementoArray.indexOf(follow[t].NT)                    
                    //Se o próximo elemento não existe (T -> F) := follow(F)=follow(T)
                    if(complementoArray[indexComplemento+1] === undefined){
                        //Pega o indice do não-terminal que produz a sentença, para buscar o follow dele
                        var indiceAux = gramatica.naoTerminais.indexOf(gramatica.producoes[q].naoTerminais);
                        //Follow do elemento é o follow do não-terminal que produz a sentença
                        if (follow[indiceAux].follow !== "") {
                            follow[t].follow += follow[t].follow == '' ? follow[indiceAux].follow : ('|' + follow[indiceAux].follow)
                        } else if (follow[indiceAux].follow === "") {
                            controlNullFollow.push([t, indiceAux]);
                        }
                        
                    } else 
                    //Se o próximo elemento é terminal (T -> E + T) := follow(E)=+
                    if(gramatica.terminais.indexOf(complementoArray[indexComplemento+1]) > -1){
                        //Próximo elemento é follow do elemento
                        follow[t].follow += follow[t].follow == '' ? complementoArray[indexComplemento+1] : ('|' + complementoArray[indexComplemento+1])
                    } else 
                    //Se o próximo elemento é não-terminal (T -> E T) := follow(E)=first(T)
                    if(gramatica.naoTerminais.indexOf(complementoArray[indexComplemento+1]) > -1){
                        //Pega o indice do first, para buscar o first que será o follow do elemento
                        var indiceAux = gramatica.naoTerminais.indexOf(complementoArray[indexComplemento+1]);
                        //Coloca o first do próximo elemento, como follow do elemento
                        follow[t].follow += follow[t].follow == '' ? first[indiceAux].first : ('|' + first[indiceAux].first)
                    }    
                }
                    
            }
            follow[t].follow = unique(follow[t].follow)
        }

        follow = controlNullFollowFunction(follow);

        return follow;
    }

    function controlNullFollowFunction(follow) {
        if (controlNullFollow[0] !== undefined) {
            for (var u = 0; u < controlNullFollow.length; u++) {
                var followIndexAux = controlNullFollow[u][0];
                var naoTerminalIndexAux = controlNullFollow[u][1];
                follow[followIndexAux].follow += follow[followIndexAux].follow == '' ? follow[naoTerminalIndexAux].follow : ('|' + follow[naoTerminalIndexAux].follow);
                follow[followIndexAux].follow = unique(follow[followIndexAux].follow)
            }
        }

            return follow;
    }

    var controlNullFirst = [];

    // Busca os first da gramática
    function buscaFirst(gramatica, first, naoTerminais, terminais) {
        
        var terminaisArray = terminais.split(" ");
        index = gramatica.naoTerminais.indexOf(naoTerminais);
        
        if(gramatica.terminais.indexOf(terminaisArray[0]) > -1){
            
            first[index].first = first[index].first == '' ? terminaisArray[0] : (first[index].first + '|' + terminaisArray[0])     
            
        } else if(gramatica.naoTerminais.indexOf(terminaisArray[0]) > -1 && terminaisArray[0] !== naoTerminais){
            indexAux = gramatica.naoTerminais.indexOf(terminaisArray[0]);
            if (first[indexAux].first !== "") {
                first[index].first += first[index].first == '' ? first[indexAux].first : ('|' + first[indexAux].first);
            } else if (first[indexAux].first === "") {
                controlNullFirst.push([index, indexAux]);
            }
        }
        
        first[index].first = unique(first[index].first)

        first = controlNullFirstFunction(first);

        return first;
    }

    function controlNullFirstFunction(first) {
        if (controlNullFirst[0] !== undefined) {
            for (var u = 0; u < controlNullFirst.length; u++) {
                var firstIndexAux = controlNullFirst[u][0];
                var naoTerminalIndexAux = controlNullFirst[u][1];
                first[firstIndexAux].first += first[firstIndexAux].first == '' ? first[naoTerminalIndexAux].first : ('|' + first[naoTerminalIndexAux].first);
                first[firstIndexAux].first = unique(first[firstIndexAux].first)
            }
        }

        return first;
    }

    //Remove elementos repetidos da sentença
    function unique(str) {
        str = str.replace(/[ ]/g, "").split("|");
        var result = [];
        for (var i = 0; i < str.length; i++) {
            if (result.indexOf(str[i]) == -1) result.push(str[i]);
        }
        result = result.join("|");
        return result;
    }    

    /*********************** FIM DAS FUNÇÕES DE FIRST E FOLLOW ***********************/

    /*********************** FUNÇÕES DE CRIAÇÃO DE TABELA ***********************/

    // Fluxo de construção da tabela SLR
    function construcaoTabelaSLR(gramatica, follows){

        // Extende a gramática (Ex.: S' -> S)
        gramatica.producoes.splice(0, 0, {naoTerminais: gramatica.simboloInicio + "'", complemento: gramatica.simboloInicio});

        // Adiciona ponto na frente das produções
        $.each(gramatica.producoes, function(i, producao){
            producao.complemento = ". " + producao.complemento;
        });
    
        // Declaração de arrays
        var goto = [];
        var arrayResolvidos = [];
    
        // Insere produção inicial no array (I0)
        goto.push(novoItemGoto(null,null, formataProducao(gramatica.producoes[0]), gramatica, null));
        arrayResolvidos.push(novoItemGoto(null,null, formataProducao(gramatica.producoes[0]), gramatica, null));

        // Resolve cada item da lista de Goto
        for (var x = 0; x < goto.length; x++){

            // Divide diversas produções de um mesmo índice do array
            var producoes = goto[x].producoes.split(", ");           
            
            // Declaração de array auxiliar utilizado para verificar se produção já foi verificada neste item
            var tempResolvidos = [];

            // Para cada produção do item
            $.each(producoes, function(i, item){

                // Verifica o símbolo que se encontra após o ponto
                var simbolo= verificaPonto(item);

                // Se produção ainda não foi verificada neste item e se produção ainda não foi resolvida
                if (tempResolvidos.indexOf(item) == -1 && simbolo != "") {

                    // Insere produção no array auxiliar
                    tempResolvidos.push(item);                      

                    // Avança o ponto para a próxima posição
                    var novaProducao = avancaPonto(item);

                    // Percorre demais produções do item verificando se são do mesmo NT
                    for (var j = i + 1; j < producoes.length; j++) {
                        // Se encontrar mais produções do mesmo NT, trata elas juntas
                        if (verificaPonto(producoes[j]) == simbolo) {
                            novaProducao += novaProducao != "" ? ", " + avancaPonto(producoes[j]) : avancaPonto(producoes[j]);
                            tempResolvidos.push(producoes[j]);
                        }
                    }                        

                    // Se novo item gerado possuir produções
                    if (novaProducao != "") {

                        // Se novo item ainda não foi tratado, insere no array de pendências "goto"
                        var gotoIndex = existeGoto(novaProducao, goto);
                        if (gotoIndex == -1) {
                            goto.push(novoItemGoto(x, simbolo, novaProducao, gramatica, x));
                        }
                        // Insere no array de itens resolvidos
                        var gotoIndex = existeGoto(novaProducao, goto);
                        arrayResolvidos.push(novoItemGoto(x, simbolo, novaProducao, gramatica, gotoIndex));
                    }                        
                }                    
            });
        }

        ////////////////// INÍCIO DA ESTRUTURAÇÃO DA TABELA //////////////////

        // Insere $ na lista de símbolos terminais para ser utilizado na montagem da tabela
        gramatica.terminais.push("$");

        // Inicializa array que armazena ações com o tamanho necessário
        var arrayAcao = new Array(goto.length);
        for (var i = 0; i < arrayAcao.length; i++) {
            arrayAcao[i] = new Array(gramatica.terminais.length);
        }

        // Inicializa array que armazena desvios com o tamanho necessário
        var arrayDesvio = new Array(goto.length);
        for (var i = 0; i < arrayDesvio.length; i++) {
            arrayDesvio[i] = new Array(gramatica.naoTerminais.length);
        }

        // Insere ação de 'Aceita' na posição [1][$] do array de ações
        arrayAcao[1][$.inArray("$", gramatica.terminais)] = "Aceita";

        /// INSERÇÃO DE AÇÕES EMPILHA E DESVIOS ///

        // Percorre cada item do array Goto
        for (var i = 1; i < arrayResolvidos.length; i++) {
            
            var NT = $.inArray(arrayResolvidos[i].simbolo, gramatica.naoTerminais);
            var T = $.inArray(arrayResolvidos[i].simbolo, gramatica.terminais);

            // Se goto estiver tratando um NT, adiciona na respectiva posição do array de Desvios
            if (NT > -1){
                arrayDesvio[arrayResolvidos[i].origem][NT] = arrayResolvidos[i].passo;
            }
            // Se goto estiver tratando um T, adiciona na respectiva posição do array de Ações com ação de empilhar
            else {
                arrayAcao[arrayResolvidos[i].origem][T] = "E" + arrayResolvidos[i].passo;
            }
        }

        /// INSERÇÃO DE AÇÕES DE REDUÇÃO ///

        // Remove produção utilizada para expandir gramática
        gramatica.producoes.splice(0, 1);

        // Para cada produção da gramática
        $.each(gramatica.producoes, function(i, producao){

            // Remove . do início e insere no final para facilitar comparação
            producao.complemento = producao.complemento.substring(2);
            producao.complemento = producao.complemento + " .";

            // Padroniza formato da produção
            var prod = formataProducao(producao);

            // Busca no array de resolvidos em que passo a produção foi resolvida
            var indexResolvido = null;
            for (var x = 0; x < arrayResolvidos.length; x++) {
                if ( arrayResolvidos[x].producoes.indexOf(prod) > -1 ) {
                    indexResolvido = arrayResolvidos[x].passo;
                    break;
                }
            }

            // Pega todos os follows do respectivo NT
            var ntFollows = follows[ follows.map(function(elemento) {return elemento.NT;}).indexOf(producao.naoTerminais) ].follow.split("|");

            // Adiciona ação de redução na respectiva posição no array de ações
            for (var x = 0; x < ntFollows.length; x++) {
                arrayAcao[indexResolvido][gramatica.terminais.indexOf(ntFollows[x])] = "R" + (i+1);
            }
        });

        ////////////////// FIM DA ESTRUTURAÇÃO DA TABELA //////////////////

        // Chama função que exibe tabela e outras informações na tela
        exibeTabelaSLR(arrayAcao, arrayDesvio, gramatica, arrayResolvidos, follows);        

        // Armazena informações em variáveis de sessão do navegador para serem utilizados na verificação
        sessionStorage.setItem('resolvidos', JSON.stringify(arrayResolvidos));
        sessionStorage.setItem('acoes', JSON.stringify(arrayAcao));
        sessionStorage.setItem('desvios', JSON.stringify(arrayDesvio));
        sessionStorage.setItem('gramatica', JSON.stringify(gramatica));
        sessionStorage.setItem('goto', JSON.stringify(goto));
    }
        
    // Padroniza itens do array de Goto
    function novoItemGoto (orig, simb, prod, gramatica, passo) {
        return {origem: orig,
                simbolo: simb,
                producoes: closure(prod, gramatica),
                passo: passo};
    }

    // Trata closures de produções de itens do array de Goto
    function closure(prod, gramatica) {
        
        // Separa cada produção do item
        var producoes = prod.split(", ");
        
        // Percorre cada uma destas produções
        for (var i = 0; i < producoes.length; i++) {

            // Busca símbolo localizado após o ponto
            var simbolo = verificaPonto(producoes[i]);

            // Se símbolo for um não terminal
            if ($.inArray(simbolo, gramatica.naoTerminais) > -1) {
                
                // Percorre toda a lista de produções da gramática
                $.each(gramatica.producoes, function(i, item){

                    // Se encontra alguma produção com este NT
                    if (item.naoTerminais == simbolo) {

                        // Padroniza o formato dele
                        var producao = formataProducao(item);

                        // E adiciona na lista de produções do item se ainda não estiver
                        if ($.inArray(producao, producoes) == -1) {
                            producoes.push(producao);
                        }
                    }

                });

            }
        }

        // Concatena todas as produções para serem armazenado em uma mesma string
        prod = producoes[0];
        for (var i = 1; i < producoes.length; i++) {
            prod = prod + ", " + producoes[i];
        }               

        // Retorna produções, com todas as suas dependências
        return prod;
    }

    // Verifica posição do ponto na produção e retorna símbolo seguinte, se existir
    function verificaPonto (producao) {

        // Verifica posição do ponto na produção
        var simbolos = producao.split(" -> ")[1].split(" ");
        var posicaoPonto = simbolos.indexOf(".");

        // Se o ponto não for o último símbolo da produção
        if (posicaoPonto < simbolos.length - 1) {
            // Retorna o símbolo seguinte
            return simbolos[posicaoPonto + 1]
        }
        // Se for o último símbolo da produção
        else {
            // Retorna vazio, indicando que produção está resolvida
            return "";
        }
    }

    // Avança o ponto para a próxima posição da produção
    function avancaPonto(prod) {

        // Verifica posição do ponto
        var producao = prod.split(" -> ");
        var simbolos = producao[1].split(" ");
        var posicaoPonto = simbolos.indexOf(".");

        // Avança a posição do ponto
        simbolos[posicaoPonto] = simbolos[posicaoPonto + 1];
        simbolos[posicaoPonto + 1] = ".";

        // Concatena itens na mesma string novamente
        prod = producao[0] + " -> " + simbolos[0];
        for (var i = 1; i < simbolos.length; i++){
            prod = prod + " " + simbolos[i];
        }

        // Retorna produção atualizada
        return prod;
    }

    // Retorna produção em uma string padronizada
    function formataProducao (prod) {
        return prod.naoTerminais + " -> " + prod.complemento;
    }

    // Verifica no array de goto se esta produção já foi inserida
    function existeGoto (novaProducao, goto) {

        // Se existe, retorna seu índice
        // Senão, retorna -1

        var existe = -1;
        $.each(goto, function(j, itemJ){
            if (itemJ.producoes == novaProducao || itemJ.producoes.indexOf(novaProducao) > -1) {
                existe = j;
            }
        });

        return existe;
    }

    // Formata a tabela e as demais estruturas para serem exibidas
    function exibeTabelaSLR(arrayAcao, arrayDesvio, gramatica, arrayResolvidos, follows) {

        ////////////////// Exibe passos da criação dos conjuntos canônicos //////////////////

        // Array auxiliar que armazena itens resolvidos
        var exibidos = [0];

        // Insere primeiro item na tabela
        var html = "<tr><td>I0 = { " + arrayResolvidos[0].producoes + " }</td></tr>";

        // Percorre os demais passos
        for (var i = 1; i < arrayResolvidos.length; i++) {

            // Se item já foi resolvido, indica em que passo foi resolvido
            if (exibidos.indexOf(arrayResolvidos[i].passo) > -1) {
                html += "<tr><td>goto( I" + arrayResolvidos[i].origem + " , " + arrayResolvidos[i].simbolo + " ) = { " + arrayResolvidos[i].producoes + " } <strong>Resolvido em I" + arrayResolvidos[i].passo + "</strong></td></tr>";
            }
            // Senão, exibe resolução e insere no array auxiliar
            else {
                html += "<tr><td><strong>I" + arrayResolvidos[i].passo + "</strong> = goto( I" + arrayResolvidos[i].origem + " , " + arrayResolvidos[i].simbolo + " ) = { " + arrayResolvidos[i].producoes + " }</td></tr>";
                exibidos.push(arrayResolvidos[i].passo);
            }            
        }

        // Deixa tabela visível
        $("#table table#goto tbody").text("");
        $("#table table#goto tbody").append(html);
        

        ////////////////// Exibe Follows dos NT //////////////////

        var html = "";

        for (var i = 0; i < follows.length; i++) {
            splitedFollow = follows[i].follow.split("|");

            html += "<li>Follow(" + follows[i].NT + ") = { " + splitedFollow[0];

            for (var x = 1; x < splitedFollow.length; x++) {
                html += " , " + splitedFollow[x];
            }

            html += " }</li>";
        }       

        $("ul#follow").text("");
        $("ul#follow").append(html);


        ////////////////// Exibe Produções Separadas da Gramática //////////////////

        var html = "";
        
        for (var i = 0; i < gramatica.producoes.length; i++) {
            gramatica.producoes[i].complemento = gramatica.producoes[i].complemento.substring(0, gramatica.producoes[i].complemento.length - 2)
            html += "<li>" + formataProducao(gramatica.producoes[i]) + "</li>";

        }       

        $("ol#listaProducoes").text("");
        $("ol#listaProducoes").append(html);        


        ////////////////// Exibe tabela construída //////////////////


        // Insere linha de legendas legendas das colunas
        var html = "<tr><th></th><th colspan='" + gramatica.terminais.length + "'>Ação</th><th colspan='" + gramatica.naoTerminais.length + "'>Desvio</th></tr>";

        // Insere linha com Ts e NTs
        html += "<tr><th></th>";
        
        for (var i = 0; i < gramatica.terminais.length; i++) {
            html += "<th>" + gramatica.terminais[i] + "</th>";
        }
        for (var i = 0; i < gramatica.naoTerminais.length; i++) {
            html += "<th>" + gramatica.naoTerminais[i] + "</th>";
        }

        html += "</tr>";

        // Insere cada linha da tabela
        for (var i = 0; i < arrayAcao.length; i++) {
            html += "<tr><th>" + i + "</th>";

            // Insere ações da linha
            for (var j = 0; j < gramatica.terminais.length; j++) {
                html += arrayAcao[i][j] != null ? "<td>" + arrayAcao[i][j] + "</td>" : "<td></td>";
            }
            // Insere desvios da linha
            for (var j = 0; j < gramatica.naoTerminais.length; j++) {
                html += arrayDesvio[i][j] != null ? "<td>" + arrayDesvio[i][j] + "</td>" : "<td></td>";
            }

            html += "</tr>";
        }        
        
        // Exibe tabela
        $("#table table#slr tbody").text("");
        $("#table table#slr tbody").append(html);

        $("#table").show();

        $('html,body').animate({ scrollTop: $("#table").offset().top }, 'slow');
    }

    // Separa NT que possuem mais de uma produção na mesma linha em linhas diferentes
    function separaProducoes (gramatica) {
        
        // Percorre lista de produções
        for (var x = 0; x < gramatica.producoes.length; x++) {

            // Se possui mais de uma produção
            if (gramatica.producoes[x].complemento.indexOf(" | ") > -1) {

                // Separa produções
                var producoes = gramatica.producoes[x].complemento.split(" | ");
                var arrayProducoes = [];

                // Gera produções separadas
                for (var i = 0; i < producoes.length; i++) {
                    arrayProducoes.push( {naoTerminais: gramatica.producoes[x].naoTerminais, complemento: producoes[i]} );
                }

                // Insere produções individuais no lugar da original
                gramatica.producoes.splice(x, 1);
                for (var i = 0; i < producoes.length; i++) {
                    gramatica.producoes.splice(x + i, 0, arrayProducoes[i]);
                }                
            }
        }

        // Retorna gramática atualizada
        return gramatica;
    }

    /*********************** FIM DAS FUNÇÕES DE CRIAÇÃO DE TABELA ***********************/

    /*********************** FUNÇÕES DE VERIFICAÇÃO DE SENTENÇA ***********************/

    function construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica, arrayResolvidos) {
        var passos = 1;
        var pilha = ["0"];
        var sentenca =  $("#sentenca").val().split(" ");
        sentenca.push("$");
        var html = "<table class='table table-bordered table-hover table-striped'>";
        html += "<thead><tr><th>Pilha</th><th>Fita de Entrada</th><th>Ação</th></tr></thead><tbody>";

        while(true) {
            // busca a key do item nos terminais
            var keyInput = Object.keys(gramatica.terminais).filter(function (key) {
                return gramatica.terminais[key] === sentenca[0]
            })[0];
            var action = arrayAcao[pilha[pilha.length - 1]][keyInput];
            // se nao houver acoes retorna erro
            if (!action) {
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'E');
                break;
            }
            // se na tabela o elemento for aceite
            if (action === 'Aceita') {
                // retorna a parte da tabela de analisar
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'A');
                break;
            }
            // pega o numero que tem ao lado da letra na tabela
            var n = parseInt(action.substr(1), 10);
            // se for empilhar
            if (action.indexOf("E") !== -1) {
                html += tdTabelaAnalisar(n, pilha, sentenca, 'S');
                // adiciona a sentença e o numero na pilha
                pilha.push(sentenca[0], n);
                // remove o primeiro elemento da sentença
                sentenca.shift();
            }
            // reducao
            if (action.indexOf("R") !== -1) {
                // busca a producao completa
                var producao = gramatica.producoes[n-1].complemento.replace(".", "");
                // busca lado esquerdo producao
                var producaoLeft = gramatica.producoes[n-1].naoTerminais.trim();
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'Reduz '+producaoLeft+" -> "+producao);
                // remove elementos da pilha de acordo com quantidade de producoes
                for(var i=0; i < producao.trim().split(" ").length * 2; i++){
                    pilha.pop();
                }
                // busca key da producao esquerda
                var keyNaoTerminais = Object.keys(gramatica.naoTerminais).filter(function (key) {
                    return gramatica.naoTerminais[key] === producaoLeft
                })[0];
                // busca numero na tabela de desvio
                var desvio = arrayDesvio[pilha[pilha.length - 1]][keyNaoTerminais];
                // se nao houver desvio retorna erro
                if(!desvio){
                    html += tdTabelaAnalisar(passos, pilha, sentenca, 'E');
                    break;
                }
                // adiciona na pilha a producao esquerda mais o numero do desvio
                pilha.push(producaoLeft, desvio);
            }
        }
        html += "</tbody></table>";
        return html;
    }
    
    // Função para criar linha da tabela apenas visual
    function tdTabelaAnalisar(passos, pilha, sentenca, acao){
        var html ="<tr>";
        html +="<td>"+pilha.join(" ")+"</td>";
        html +="<td style='text-align: right'>"+sentenca.join(" ")+"</td>";
        html +="<td>"+(acao === 'E' ? "ERRO" : (acao === 'S' ? "Empilha E"+passos : (acao === 'A' ? "Aceita" : acao)))+"</td></tr>";
        return html;
    }

    /*********************** FIM DAS FUNÇÕES DE VERIFICAÇÃO DE SENTENÇA ***********************/
});