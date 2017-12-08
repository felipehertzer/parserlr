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

            //Criação dos conjuntos canônicos
            //Utiliza estrutura de follow
            //Constrói e exibe toda a tabela com os arrays abaixo
            //Estes arrays são utilizados para a etapa de teste
            
            //Saídas:
            /*--------------------------------
              arrayAcao[0] = {for:e2}
              ...
              arrayAcao[11] = {for:e2,
                                id:r5}                    
            */

            /*-------------------------------
              arrayDesvio[0] = {S:1}
              ...
              arrayDesvio[3] = {A:4}
              ...
              arrayDesvio[11] = {S:15,A:14}
            */

            /***************************************************************************/
            
            //No momento do clique do botão de reconhecimento
            
            //Recebe sentença para testar
            //Utiliza arrayAcao e arrayDesvio para testar
            //Contrói e exibe tabela

        }

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

});