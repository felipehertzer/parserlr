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
            

            /***************************************************************************/

            //estruturaFollows = buscaFirstFollow(gramatica);
            /*
            follows = {S:a|s|$,
                       A:c|e}
            */

            /***************************************************************************/

            construcaoTabelaSLR(gramatica);

            reducao(gramatica);

        }

    });

    $("#analisar").on("click", function () {

        var arrayAcao = JSON.parse(sessionStorage.getItem('acoes'));
        var arrayDesvio = JSON.parse(sessionStorage.getItem('desvios'));
        var gramatica = JSON.parse(sessionStorage.getItem('gramatica'));

        var html = construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica);

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

    function construcaoTabelaSLR(gramatica){

        // Aumenta a gramática
        gramatica.producoes.splice(0, 0, {naoTerminais: gramatica.simboloInicio + "'", complemento: gramatica.simboloInicio});

        $.each(gramatica.producoes, function(i, producao){
            producao.complemento = ". " + producao.complemento;
        });
    
        // Operação goto
        var goto = [];
        var arrayResolvidos = [];
    
        //Insere primeiro item
        goto.push(novoItemGoto(null,null, formataProducao(gramatica.producoes[0]), gramatica));

        for (var x = 0; x < goto.length; x++){
            var producoes = goto[x].producoes.split(", ");

            if (producoes.length == 1 && verificaPonto(producoes[0]) == ""){
                arrayResolvidos.push(producoes[0]);
            }
            else {
                $.each(producoes, function(i, item){
                    var simbolo= verificaPonto(item);
                    var novaProducao = avancaPonto(item);
                    var existe = false;
                    $.each(goto, function(j, itemJ){
                        if (itemJ.producoes == novaProducao) {
                            existe = true;
                        }
                    });
                    if (!existe) {
                        goto.push(novoItemGoto(x, simbolo, novaProducao, gramatica));
                    };
                });
            }
        }

        gramatica.terminais.push("$");

        var arrayAcao = new Array(goto.length);
        for (var i = 0; i < arrayAcao.length; i++) {
            arrayAcao[i] = new Array(gramatica.terminais.length);
        }

        var arrayDesvio = new Array(goto.length);
        for (var i = 0; i < arrayDesvio.length; i++) {
            arrayDesvio[i] = new Array(gramatica.naoTerminais.length);
        }

        arrayAcao[1][$.inArray("$", gramatica.terminais)] = "Aceita";

        for (var i = 1; i < goto.length; i++) {
            
            var NT = $.inArray(goto[i].simbolo, gramatica.naoTerminais);
            var T = $.inArray(goto[i].simbolo, gramatica.terminais);

            if (NT > -1){
                arrayDesvio[goto[i].origem][NT] = i;
            }
            else {
                arrayAcao[goto[i].origem][T] = "E" + i;
            }
        }

        exibeTabelaSLR(arrayAcao, arrayDesvio, gramatica);

        sessionStorage.setItem('acoes', JSON.stringify(arrayAcao));
        sessionStorage.setItem('desvios', JSON.stringify(arrayDesvio));
        sessionStorage.setItem('gramatica', JSON.stringify(gramatica));
        sessionStorage.setItem('goto', JSON.stringify(goto));
    }
        
    function novoItemGoto (orig, simb, prod, gramatica) {
        return {origem: orig,
                simbolo: simb,
                producoes: closure(prod, gramatica)};
    }

    function closure(prod, gramatica) {

        var producoes = prod.split(", ");
        
        for (var i = 0; i < producoes.length; i++) {
            var simbolo = verificaPonto(producoes[i]);

            if ($.inArray(simbolo, gramatica.naoTerminais) > -1) {
                
                $.each(gramatica.producoes, function(i, item){

                    if (item.naoTerminais == simbolo) {
                        var producao = item.naoTerminais + " -> " + item.complemento;
                        if ($.inArray(producao, producoes) == -1) {
                            producoes.push(producao);
                        }
                    }

                });

            }
        }

        prod = producoes[0];
        for (var i = 1; i < producoes.length; i++) {
            prod = prod + ", " + producoes[i];
        }               

        return prod;
    }

    function verificaPonto (producao) {
        var simbolos = producao.split(" -> ")[1].split(" ");
        var posicaoPonto = simbolos.indexOf(".");

        if (posicaoPonto < simbolos.length - 1) {
            return simbolos[posicaoPonto + 1]
        }
        else {
            return "";
        }
    }

    function avancaPonto(prod) {
        var producao = prod.split(" -> ");
        var simbolos = producao[1].split(" ");
        var posicaoPonto = simbolos.indexOf(".");
        simbolos[posicaoPonto] = simbolos[posicaoPonto + 1];
        simbolos[posicaoPonto + 1] = ".";

        prod = producao[0] + " -> " + simbolos[0];
        for (var i = 1; i < simbolos.length; i++){
            prod = prod + " " + simbolos[i];
        }

        return prod;
    }

    function formataProducao (prod) {
        return prod.naoTerminais + " -> " + prod.complemento;
    }

    function exibeTabelaSLR(arrayAcao, arrayDesvio, gramatica) {
        
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
        
        
        $("#table table tbody").text("");
        $("#table table tbody").append(html);

        $("#table").show();

        $('html,body').animate({
            scrollTop: $("#table").offset().top
        }, 'slow');
    }

    /*********************** FIM DAS FUNÇÕES DE CRIAÇÃO DE TABELA ***********************/
    function reducao(gramatica){
        gramatica.first = [];
        gramatica.follow = [];
        var count = 0;

        /*var arrayAcaoInside = []
        $.each(gramatica.naoTerminais, function (a, b) {
            var result = buscaFollow(gramatica, b);
            $.each(result.split(','), function (x, y) {

            });
        });*/

        /*var arrayAcao = JSON.parse(sessionStorage.getItem('acoes'));
        for (var i = 0; i < arrayAcao.length; i++) {
            for (var j = 0; j < gramatica.terminais.length; j++) {
                arrayAcao[i][j] = "r"+count++;
            }
        }
        sessionStorage.setItem('acoes', JSON.stringify(arrayAcao));*/
    }

    function construcaoTabelaAnalisar(arrayAcao, arrayDesvio, gramatica) {
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
                pilha.push(sentenca[0], n);
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'S');
                sentenca.shift();
            }

            if (action.indexOf("R") !== -1) {
                // pega a producao de acordo com o n
                for(var i=0; i < desvio * 2; i++){
                    pilha.pop();
                }
                //trocar sentenca pela producao esquerda
                var keyNaoTerminais = Object.keys(gramatica.naoTerminais).filter(function (key) {
                    return gramatica.naoTerminais[key] === sentenca[0]
                })[0];
                var desvio = arrayDesvio[pilha[pilha.length - 1]][keyNaoTerminais];
                if(!desvio){
                    html += tdTabelaAnalisar(passos, pilha, sentenca, 'E');
                    break;
                }
                html += tdTabelaAnalisar(passos, pilha, sentenca, 'Reduz ');
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