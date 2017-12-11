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

    }).keypress(function(e){

        // bloqueia a tecla espaco
        if (e.keyCode === 32) return false;
        // adiciona a virgula automaticamente
        if (e.which !== 0) {
            if ($(this).val().length > 0)
                $(this).val($(this).val() + ", ");
        }
    }).keydown(function(e){

        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }
    });

    $("#terminais").keyup(function(e){
        //checa se ja existe no array
        if(temDuplicados($(this).val().split(", "))){
            $("#status").html(status_invalido);
        } else {
            $("#status").html(status_valido);
        }


    }).keypress(function(e){

        if (e.keyCode === 32) {
            if ($(this).val().length > 0)
                $(this).val($(this).val() + " , ");
        }

    }).keydown(function(e){

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

    //Da refresh na página
    $("button#refresh").on("click", function () {
        window.location.reload(true);
    });

    //Insere gramática de exemplo
    $("button#exemplo-gramatica").on("click", function () {
        $("#first-follow").hide();
        $("#table").hide();
        $("#output").hide();

        /*$("#nao-terminais").val("S, A, E, C"); 
        $("#terminais").val("for , ( , ; , ) , id , = , oprel");*/

        $("#nao-terminais").val("E, T, F"); 
        $("#terminais").val("+ , * , ( , ) , id");
        
        $("#terminais").prop("disabled", false);

        $('#simbolo-inicio').empty().prop('disabled', false);
        $.each($("#nao-terminais").val().split(","), function (i, item) {
            $('#simbolo-inicio').append($('<option>', {
                value: item,
                text : item.toUpperCase()
            }));
        });

        /*var producoes = [{NT: "S", T: "for ( A ; E ) C"}, {NT: "A", T: "id = id"}, {NT: "E", T: "id oprel id"}, {NT: "C", T: "A | S"}];*/
        var producoes = [{NT: "E", T: "E + T | T"}, {NT: "T", T: "T * F | F"}, {NT: "F", T: "( E ) | id"}];

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