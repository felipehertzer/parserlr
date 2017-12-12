$(document).ready(function () {

    //Monta a tabela no clique
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
            
            gramatica = separaProducoes(gramatica);

            /***************************************************************************/

            // REALIZAR CHAMADA DA BUSCA DOS FOLLOW AQUI
            // COMENTAR TRECHO ABAIXO

            /*var follows = [{NT: "S", follow: "$"},
                            {NT: "A", follow: ";|$"},
                            {NT: "E", follow: ")"},
                            {NT: "C", follow: "$"}];*/

            var follows = [{NT: "E", follow: "+|)|$"},
                            {NT: "T", follow: "+|*|)|$"},
                            {NT: "F", follow: "+|*|)|$"}];

            /***************************************************************************/

            construcaoTabelaSLR(gramatica, follows);
        }

    });

    $("#analisar").on("click", function () {

        // Busca dados armazenados nas variáveis de sessão do navegador
        var arrayResolvidos = JSON.parse(sessionStorage.getItem('resolvidos'));
        var arrayAcao = JSON.parse(sessionStorage.getItem('acoes'));
        var arrayDesvio = JSON.parse(sessionStorage.getItem('desvios'));
        var gramatica = JSON.parse(sessionStorage.getItem('gramatica'));

        var html = construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica, arrayResolvidos);

        $("#output").css("display", "block");
        $(".saida").html(html);
    });

    /*********************** FUNÇÕES DE FIRST E FOLLOW ***********************/

    function buscaFirstFollow(gramatica) {
        //Inicializa array do first e follow no objeto gramatica
        gramatica.first = [];
        gramatica.follow = [];

        //Percorre produções, gerando o first do não terminal em cada iteração
        for (var i = (gramatica.producoes.length - 1); i >= 0; i--) {
            gramatica = buscaFirst(gramatica, gramatica.producoes[i].naoTerminais);
            gramatica.first[i].first = unique(gramatica.first[i].first);
        }

        //Inicializa o follow do símbolo de início de produção da gramática
        var indexFirstFollow = gramatica.producoes.findIndex(x => x.naoTerminais == gramatica.simboloInicio);
        gramatica.follow[indexFirstFollow] = {};
        gramatica.follow[indexFirstFollow].naoTerminal = gramatica.simboloInicio;
        gramatica.follow[indexFirstFollow].follow = '$';

        //Percorre produções, gerando o follow do não terminal em cada iteração
        for (var t = 0; t < gramatica.producoes.length; t++) {
            gramatica = buscaFollow(gramatica, gramatica.producoes[t].naoTerminais);
        }
        for (var t = 0; t < gramatica.producoes.length; t++) {
            gramatica.follow[t].follow = unique(gramatica.follow[t].follow);
            if(gramatica.follow[t].follow.indexOf('&')>-1){
                var arrayTemp = gramatica.follow[t].follow.replace(/\s/g, '').split(',');
                for(key in arrayTemp){
                    if(arrayTemp[key].indexOf('&')>-1){
                        arrayTemp.splice(key, 1);
                    }
                }
                gramatica.follow[t].follow = arrayTemp.join(", ");
            }
        }
        
        return gramatica;
    }

    var controlNullFirst = [];

    // Busca os first da gramática
    function buscaFirst(gramatica, simbolo) {
        //Buscar first de todos os não-terminais e armazenar no objeto aqui
        var firstIndex = gramatica.producoes.findIndex(x => x.naoTerminais == simbolo);
        var producoesAux = gramatica.producoes[firstIndex].complemento.replace(/\s/g, '').split("|");

        //Inicializa o atributo first do símbolo analisado
        gramatica.first[firstIndex] = {};
        gramatica.first[firstIndex].first = '';
        gramatica.first[firstIndex].naoTerminal = simbolo;

        //Gera o first do símbolo analisado, percorrendo as produções deste símbolo
        for (var j = 0; j < producoesAux.length; j++) {
            //Caso o primeiro elemento da produção seja um terminal, é adicionado ao first
            if (producoesAux[j].charAt(0) === producoesAux[j].charAt(0).toLowerCase()) {
                gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? producoesAux[j].charAt(0) : (', ' + producoesAux[j].charAt(0));
            } else if (producoesAux[j].charAt(0) === producoesAux[j].charAt(0).toUpperCase()) {
                //Caso o primeiro elemento seja um não terminal, inicia a verificação do first deste não terminal
                var naoTerminalIndex = gramatica.producoes.findIndex(x => x.naoTerminais == producoesAux[j].charAt(0));
                if (gramatica.producoes[naoTerminalIndex].complemento.indexOf('&') > -1) {
                    if (producoesAux[j].length !== 1) {
                        var naoTerminalProximoIndex = gramatica.producoes.findIndex(x => x.naoTerminais == producoesAux[j].charAt(1));
                        if (gramatica.first[naoTerminalIndex] !== undefined) {
                            gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? gramatica.first[naoTerminalIndex].first : (', ' + gramatica.first[naoTerminalIndex].first);
                        } else if (gramatica.first[naoTerminalIndex] === undefined) {
                            var auxArray = [firstIndex, naoTerminalIndex];
                            controlNullFirst.push(auxArray);
                        }
                        if (producoesAux[j].charAt(1) === producoesAux[j].charAt(1).toLowerCase()) {
                            gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? producoesAux[j].charAt(1) : (', ' + producoesAux[j].charAt(1));
                        }
                        else if (producoesAux[j].charAt(1) === producoesAux[j].charAt(1).toUpperCase()) {
                            if (gramatica.first[naoTerminalIndex] !== undefined) {
                                gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? gramatica.first[naoTerminalIndex].first : (', ' + gramatica.first[naoTerminalIndex].first);
                            } else if (gramatica.first[naoTerminalIndex] === undefined) {
                                var auxArray = [firstIndex, naoTerminalIndex];
                                controlNullFirst.push(auxArray);
                            }
                        }
                    } else {
                        if (gramatica.first[naoTerminalIndex] !== undefined) {
                            gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? gramatica.first[naoTerminalIndex].first : (', ' + gramatica.first[naoTerminalIndex].first);
                        } else if (gramatica.first[naoTerminalIndex] === undefined) {
                            var auxArray = [firstIndex, naoTerminalIndex];
                            controlNullFirst.push(auxArray);
                        }
                    }
                } else {
                    //Caso o first do não terminal não tenha sido resolvido ainda, seta como pendência para resolver depois
                    if (gramatica.first[naoTerminalIndex] !== undefined) {
                        gramatica.first[firstIndex].first += gramatica.first[firstIndex].first == '' ? gramatica.first[naoTerminalIndex].first : (', ' + gramatica.first[naoTerminalIndex].first);
                    } else if (gramatica.first[naoTerminalIndex] === undefined) {
                        var auxArray = [firstIndex, naoTerminalIndex];
                        controlNullFirst.push(auxArray);
                    }
                }
            }
        }
        //Resolve as pendências dos first
        if (controlNullFirst[0] !== undefined && simbolo === gramatica.producoes[0].naoTerminais) {
            for (var u = 0; u < controlNullFirst.length; u++) {
                var firstIndexAux = controlNullFirst[u][0];
                var naoTerminalIndexAux = controlNullFirst[u][1];
                gramatica.first[firstIndexAux].first += gramatica.first[firstIndexAux].first == '' ? gramatica.first[naoTerminalIndexAux].first : (', ' + gramatica.first[naoTerminalIndexAux].first);
            }
        }
        return gramatica;
    }

    //Remove elementos repetidos da sentença
    function unique(str) {
        str = str.replace(/[ ]/g, "").split(",");
        var result = [];
        for (var i = 0; i < str.length; i++) {
            if (result.indexOf(str[i]) == -1) result.push(str[i]);
        }
        result = result.join(", ");
        return result;
    }

    var controlNullFollow = [];
    // Busca os follows da gramática
    function buscaFollow(gramatica, simbolo) {
        //Buscar follow de todos os não-terminais e armazenar no objeto aqui
        var firstIndex = gramatica.producoes.findIndex(x => x.naoTerminais == simbolo);
        //Inicializa o atributo follow para o símbolo analisado

        if (gramatica.follow[firstIndex] === undefined) {
            gramatica.follow[firstIndex] = {};
            gramatica.follow[firstIndex].naoTerminal = simbolo;
            gramatica.follow[firstIndex].follow = '';
        }
        //Constroi uma matriz das produções da grámatica, para buscar as ocorrências dos não terminais
        var prodAux = [];
        for (var i = 0; i < gramatica.producoes.length; i++) {
            prodAux[i] = gramatica.producoes[i].complemento.replace(/\s/g, '').split("|");
        }
        //Iteração das produçõs, para definir o follow do não terminal analisado
        for (var j = 0; j < prodAux.length; j++) {
            for (var k = 0; k < prodAux[j].length; k++) {
                if (prodAux[j][k].indexOf(simbolo) > -1) {
                    //Caso o símbolo analisado seja o último elemento da produção, seleciona o follow do não terminal que produz a sentença analisada
                    if (prodAux[j][k].indexOf(simbolo) === (prodAux[j][k].length - 1)) {
                        if (simbolo !== gramatica.producoes[j].naoTerminais) {
                            var naoTerminalIndex = gramatica.producoes.findIndex(x => x.naoTerminais == gramatica.producoes[j].naoTerminais);
                            if (gramatica.follow[naoTerminalIndex] !== undefined) {
                                gramatica.follow[firstIndex].follow += gramatica.follow[firstIndex].follow == '' ? gramatica.follow[naoTerminalIndex].follow : (', ' + gramatica.follow[naoTerminalIndex].follow);
                            } else if (gramatica.follow[naoTerminalIndex] === undefined) {
                                var auxArray = [firstIndex, naoTerminalIndex];
                                controlNullFollow.push(auxArray);
                            }
                        }
                    } else if (prodAux[j][k].indexOf(simbolo) < (prodAux[j][k].length - 1)) {
                        //Se o próximo elemento do símbolo analisado for um não terminal, seleciona o first daquele elemento
                        if (prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)) === prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)).toUpperCase()) {
                            var naoTerminalIndex = gramatica.producoes.findIndex(x => x.naoTerminais == prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)));
                            gramatica.follow[firstIndex].follow += gramatica.follow[firstIndex].follow == '' ? gramatica.first[naoTerminalIndex].first : (', ' + gramatica.first[naoTerminalIndex].first);
                            //Se este não terminal produzir sentença vazia, também seleciona o follow dele
                            if(gramatica.producoes[naoTerminalIndex].complemento.indexOf('&') > -1){
                                if (gramatica.follow[naoTerminalIndex] !== undefined) {
                                    gramatica.follow[firstIndex].follow += gramatica.follow[firstIndex].follow == '' ? gramatica.follow[naoTerminalIndex].follow : (', ' + gramatica.follow[naoTerminalIndex].follow);
                                } else if (gramatica.follow[naoTerminalIndex] === undefined) {
                                    var auxArray = [firstIndex, naoTerminalIndex];
                                    controlNullFollow.push(auxArray);
                                }    
                            }
                        } else if (prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)) === prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)).toLowerCase()) {
                            //Se o próximo elemento do simbolo analisado for um terminal, adiciona o elemento como follow
                            gramatica.follow[firstIndex].follow += gramatica.follow[firstIndex].follow == '' ? prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)) : (', ' + prodAux[j][k].charAt((prodAux[j][k].indexOf(simbolo) + 1)));
                        }
                    }
                }
            }
        }
        //Resolve as pendências dos follows
        if (controlNullFollow[0] !== undefined && simbolo === gramatica.producoes[gramatica.producoes.length-1].naoTerminais) {
            for (var u = 0; u < controlNullFollow.length; u++) {
                var firstIndexAux = controlNullFollow[u][0];
                var naoTerminalIndexAux = controlNullFollow[u][1];
                gramatica.follow[firstIndexAux].follow += gramatica.follow[firstIndexAux].follow == '' ? gramatica.follow[naoTerminalIndexAux].follow : (', ' + gramatica.follow[naoTerminalIndexAux].follow);
            }
        }
        return gramatica;
    }

    /*********************** FIM DAS FUNÇÕES DE FIRST E FOLLOW ***********************/

    /*********************** FUNÇÕES DE CRIAÇÃO DE TABELA ***********************/

    function construcaoTabelaSLR(gramatica, follows){

        // Extende a gramática
        gramatica.producoes.splice(0, 0, {naoTerminais: gramatica.simboloInicio + "'", complemento: gramatica.simboloInicio});

        // Adiciona ponto na frente das produções
        $.each(gramatica.producoes, function(i, producao){
            producao.complemento = ". " + producao.complemento;
        });
    
        // Declaração de arrays
        var goto = [];
        var arrayResolvidos = [];
    
        // Insere produção inicial no array
        goto.push(novoItemGoto(null,null, formataProducao(gramatica.producoes[0]), gramatica, null));
        arrayResolvidos.push(novoItemGoto(null,null, formataProducao(gramatica.producoes[0]), gramatica, null));

        // Resolve cada item da lista de Goto
        for (var x = 0; x < goto.length; x++){

            // Divide diversas produções de um mesmo índice do array
            var producoes = goto[x].producoes.split(", ");           
            
            var tempResolvidos = [];

            // Para cada produção do item
            $.each(producoes, function(i, item){

                // Verifica o símbolo que se encontra após o ponto
                var simbolo= verificaPonto(item);

                if (tempResolvidos.indexOf(item) == -1 && simbolo != "") {

                    tempResolvidos.push(item);                      

                    // Avança o ponto para a próxima posição
                    var novaProducao = avancaPonto(item);

                    for (var j = i + 1; j < producoes.length; j++) {
                        //var gotoIndex = existeGoto(avancaPonto(producoes[j]), goto);
                        if (verificaPonto(producoes[j]) == simbolo) {
                            novaProducao += novaProducao != "" ? ", " + avancaPonto(producoes[j]) : avancaPonto(producoes[j]);
                            tempResolvidos.push(producoes[j]);
                        }
                    }                        

                    if (novaProducao != "") {
                        var gotoIndex = existeGoto(novaProducao, goto);
                        if (gotoIndex == -1) {
                            goto.push(novoItemGoto(x, simbolo, novaProducao, gramatica, x));
                        }
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
        
    function novoItemGoto (orig, simb, prod, gramatica, passo) {
        // Padroniza itens do array de Goto
        return {origem: orig,
                simbolo: simb,
                producoes: closure(prod, gramatica),
                passo: passo};
    }

    function closure(prod, gramatica) {
        // Trata closures de produções de itens do array de Goto

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

                        // E adiciona na lista de produções do item
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

    function verificaPonto (producao) {

        // Verifica posição do ponto na produção
        var simbolos = producao.split(" -> ")[1].split(" ");
        var posicaoPonto = simbolos.indexOf(".");

        // Se não for o último item da lista
        if (posicaoPonto < simbolos.length - 1) {
            // Retorna o símbolo seguinte
            return simbolos[posicaoPonto + 1]
        }
        // Se for o último item da lista
        else {
            // Retorna vazio, indicando que produção está resolvida
            return "";
        }
    }

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

    function formataProducao (prod) {
        // Retorna produção em uma string padronizada
        return prod.naoTerminais + " -> " + prod.complemento;
    }

    function exibeTabelaSLR(arrayAcao, arrayDesvio, gramatica, arrayResolvidos, follows) {

        ////////////////// Exibe passos da criação dos conjuntos canônicos //////////////////

        var exibidos = [0];
        var html = "<tr><td>I0 = { " + arrayResolvidos[0].producoes + " }</td></tr>";

        for (var i = 1; i < arrayResolvidos.length; i++) {
            if (exibidos.indexOf(arrayResolvidos[i].passo) > -1) {
                html += "<tr><td>goto( I" + arrayResolvidos[i].origem + " , " + arrayResolvidos[i].simbolo + " ) = { " + arrayResolvidos[i].producoes + " } <strong>Resolvido em I" + arrayResolvidos[i].passo + "</strong></td></tr>";
            }
            else {
                html += "<tr><td><strong>I" + arrayResolvidos[i].passo + "</strong> = goto( I" + arrayResolvidos[i].origem + " , " + arrayResolvidos[i].simbolo + " ) = { " + arrayResolvidos[i].producoes + " }</td></tr>";
                exibidos.push(arrayResolvidos[i].passo);
            }
            
        }

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

        ////////////////// Exibe tabela construída //////////////////

        var html = "<tr><th></th><th colspan='" + gramatica.terminais.length + "'>Ação</th><th colspan='" + gramatica.naoTerminais.length + "'>Desvio</th></tr>";

        html += "<tr><th></th>";
        
        for (var i = 0; i < gramatica.terminais.length; i++) {
            html += "<th>" + gramatica.terminais[i] + "</th>";
        }
        for (var i = 0; i < gramatica.naoTerminais.length; i++) {
            html += "<th>" + gramatica.naoTerminais[i] + "</th>";
        }

        html += "</tr>";

        for (var i = 0; i < arrayAcao.length; i++) {
            html += "<tr><th>" + i + "</th>";

            for (var j = 0; j < gramatica.terminais.length; j++) {
                html += arrayAcao[i][j] != null ? "<td>" + arrayAcao[i][j] + "</td>" : "<td></td>";
            }
            for (var j = 0; j < gramatica.naoTerminais.length; j++) {
                html += arrayDesvio[i][j] != null ? "<td>" + arrayDesvio[i][j] + "</td>" : "<td></td>";
            }

            html += "</tr>";
        }        
        
        $("#table table#slr tbody").text("");
        $("#table table#slr tbody").append(html);

        $("#table").show();

        $('html,body').animate({
            scrollTop: $("#table").offset().top
        }, 'slow');
    }

    function separaProducoes (gramatica) {
        // Separa NT que possuem mais de uma produção na mesma linha em linhas diferente

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

    function existeGoto (novaProducao, goto) {
        // Verifica no array de goto se esta produção já foi inserida
        var existe = -1;
        $.each(goto, function(j, itemJ){
            if (itemJ.producoes == novaProducao || itemJ.producoes.indexOf(novaProducao) > -1) {
                existe = j;
            }
        });

        return existe;
    }

    /*********************** FIM DAS FUNÇÕES DE CRIAÇÃO DE TABELA ***********************/


    function construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica, arrayResolvidos) {
        var passos = 1;
        var pilha = ["0"];
        var sentenca =  $("#sentenca").val().split(" ");
        sentenca.push("$");
        var html = "<table class='table table-bordered table-hover table-striped'>";
        html += "<thead><tr><th>Pilha</th><th>Fita de Entrada</th><th>Ação</th></tr></thead><tbody>";

        while(true) {

            var keyInput = Object.keys(gramatica.terminais).filter(function (key) {
                return gramatica.terminais[key] === sentenca[0]
            })[0];
            var action = arrayAcao[pilha[pilha.length - 1]][keyInput];
            console.log(action+" - "+pilha[pilha.length - 1]+" - "+keyInput);
            if (!action) {
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'E');
                break;
            }

            if (action === 'Aceita') {
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'A');
                break;
            }

            var n = parseInt(action.substr(1), 10);

            if (action.indexOf("E") !== -1) {
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'S');
                pilha.push(sentenca[0], n);
                sentenca.shift();
            }

            if (action.indexOf("R") !== -1) {

                var producao = arrayResolvidos[n].producao.replace(".", "");
                var producaoLeft = producao.split("->")[0].trim();

                var keyNaoTerminais = Object.keys(gramatica.naoTerminais).filter(function (key) {
                    return gramatica.naoTerminais[key] === producaoLeft
                })[0];

                var desvio = arrayDesvio[pilha[pilha.length - 1]][keyNaoTerminais];

                if(!desvio){
                    html += tdTabelaAnalisar(passos, pilha, sentenca, 'E');
                    break;
                }
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'Reduz '+producao);
                for(var i=0; i < 2; i++){
                    pilha.pop();
                }
                pilha.push(producaoLeft, desvio);
            }
        }
        html += "</tbody></table>";
        return html;
    }

    function tdTabelaAnalisar(passos, pilha, sentenca, acao){
        var html ="<tr>";
        html +="<td>"+pilha.join(" ")+"</td>";
        html +="<td>"+sentenca.join(" ")+"</td>";
        html +="<td>"+(acao === 'E' ? "ERRO" : (acao === 'S' ? "Empilha" : (acao === 'A' ? "Aceita" : acao)))+"</td></tr>";
        return html;
    }
});