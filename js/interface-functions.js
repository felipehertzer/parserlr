var status_valido = "<div class='alert alert-success' role='alert'><strong>Gramática Válida!</strong></div>";
var status_invalido = "<div class='alert alert-danger' role='alert'><strong>Gramática Inválida!</strong></div>";

$ (document).ready(function(){

    $("#nao-terminais").keyup(function(e){
        var simbolo_inicio = $('#simbolo-inicio').val().toUpperCase();
        $('#terminais').prop('disabled', false);
        $('#simbolo-inicio').empty().prop('disabled', false);
        $.each($(this).val().split(","), function (i, item) {
            $('#simbolo-inicio').append($('<option>', {
                value: item,
                text : item.toUpperCase()
            }));
        });
        $('.duplicar input').prop('disabled', false);

        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }

        //formalismo
        $('#formalismo').html(' G = ({ '+$(this).val().toUpperCase()+' }, { '+$('#terminais').val()+' }, '+$('#simboloConjunto').val()+', '+simbolo_inicio+')');

    }).keypress(function(e){

        // bloqueia a tecla espaco
        if (e.keyCode === 32) return false;
        // adiciona a virgula automaticamente
        if (e.which !== 0) {
            if ($(this).val().length > 0)
                $(this).val($(this).val() + ", ");
        }
    }).keydown(function(e){

        if (e.keyCode === 8) {
            $(this).val($(this).val().slice(0, -3));
            return false;
        }
        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }
    });

    $('#simbolo-inicio').on("change", function(){
        $('#formalismo').html(' G = ({ '+$("#nao-terminais").val().toUpperCase()+' }, { '+$('#terminais').val()+' }, '+$('#simboloConjunto').val()+', '+ $(this).val().toUpperCase()+')');
    });

    $("#terminais").keyup(function(e){
        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }

        var simbolo_inicio = $('#simbolo-inicio').val().toUpperCase();
        $('#formalismo').html(' G = ({ '+$("#nao-terminais").val().toUpperCase()+' }, { '+$(this).val().toLowerCase()+' }, '+$('#simboloConjunto').val()+', '+simbolo_inicio+')');

    }).keypress(function(e){

        // bloqueia a tecla espaco
        if (e.keyCode === 32) return false;
        // adiciona a virgula automaticamente
        if (e.which !== 0) {
            if ($(this).val().length > 0)
                $(this).val($(this).val() + ", ");
        }

    }).keydown(function(e){

        if (e.keyCode === 8) {
            $(this).val($(this).val().slice(0, -3));
            return false;
        }
        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }

    });

    $(".nao-terminais-producao").keyup(function (e) {
        if($.inArray($.trim($(this).val().toLowerCase()), $('#nao-terminais').val().split(", ")) > -1){
            $("#status").html(status_valido);
        } else {
            $("#status").html(status_invalido);
        }
    });

    $(".complemento-producao").keyup(function(e){
        if (e.keyCode === 32) {
            if ($(this).val().length > 0)
                $(this).val($(this).val() + "| ");
        }
    });

    //Da refresh na página
    $("button#refresh").on("click", function () {
        window.location.reload(true);
    });

    //Insere gramática de exemplo
    $("button#exemplo-gramatica").on("click", function () {
        $("#first-follow").hide();
        $("#table").hide();
        $("#output").hide();

        $("#nao-terminais").val("S, A, B");
        //$("#nao-terminais").val("S, X, Y, Z");
        //$("#nao-terminais").val("S, B, D");
        //$("#nao-terminais").val("S, A, B, C, D");
        
        $("#terminais").val("a, b, c");
        //$("#terminais").val("a, b, c, d, e, f");
        //$("#terminais").val("a, b, c, d");
        //$("#terminais").val("a, b, c, d");
        
        $("#terminais").prop("disabled", false);

        $('#simbolo-inicio').empty().prop('disabled', false);
        $.each($("#nao-terminais").val().split(","), function (i, item) {
            $('#simbolo-inicio').append($('<option>', {
                value: item,
                text : item.toUpperCase()
            }));
        });

        var producoes = [{NT: "S", T: "cAa"}, {NT: "A", T: "cB | B"}, {NT: "B", T: "bcB | &"}];
        //var producoes = [{NT: "S", T: "XYZ"}, {NT: "X", T: "aXb | &"}, {NT: "Y", T: "cYZcX | d"}, {NT: "Z", T: "eZYe | f"}];
        //var producoes = [{NT: "S", T: "aB | d"}, {NT: "B", T: "cDb | &"}, {NT: "D", T: "a | & | dSD"}];
        //var producoes = [{NT: "S", T: "BA"}, {NT: "A", T: "aBA | &"}, {NT: "B", T: "DC"}, {NT: "C", T: "bDC | &"}, {NT: "D", T: "cD | d"}];
        $('.duplicar').remove();
        var html = "";
        $.each(producoes, function (i, item) {
            html += '<div class="duplicar">'
            + '<div class="col-sm-3"><input type="text" class="form-control nao-terminais-producao" value="'+ item.NT +'" name="producoes[][naoTerminais]"></div>'
            + '<div class="col-sm-1"><i class="glyphicon glyphicon-arrow-right flecha"></i></div>'
            + '<div class="col-sm-6"><input type="text" class="form-control complemento-producao" value="'+ item.T +'" name="producoes[][complemento]"></div>'
            + '<div class="col-sm-2 text-right"><button class="btn btn-danger remove btn-sm" type="button"><i class="glyphicon glyphicon-remove botao-mais"></i></button>'
            + '<button class="btn btn-primary clone btn-sm" type="button"><i class="glyphicon glyphicon-plus botao-mais"></i></button></div></div>';
        });
        $('.clones').append(html);
        $("button.clone").on("click", clone);        
        $("button.remove").on("click", remove);

        $("#status").html(status_valido);
    });

    function clone () {
        $(this).parents(".duplicar").clone(true, true)
            .insertAfter($(".clones .duplicar:last"))
            //.find($(this).parents(".duplicar").parent('.clone')).remove()
            .find("input:text").val("")
            .on('click', 'button.clone', clone)
            .on('click', 'button.remove', remove);
    }

    function remove() {
        $(this).parents(".duplicar").remove();
    }

    // verifica se ha valores duplicados
    function temDuplicados(array) {
        var valuesSoFar = Object.create(null);
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (value in valuesSoFar) {
                return true;
            }
            valuesSoFar[value] = true;
        }
        return false;
    }

    $("button.clone").on("click", clone);

    $("button.remove").on("click", remove);

});