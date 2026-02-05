
var acntSearch = (function(){

    var selectedObj;
    var selector;   // 적용시 사용할 tag
    var mode;   // 호출한메뉴 구분
    var maxDepth;

    var init = function(){
        var billType = $('#billType').val();
        if(billType == ''){
            $('#billType').focus();
            return;
        }
        remove_options(1);
        if(billType == 1 || billType == 2 || billType == 5 || billType == 6){
            $('input[name="acntType"][value='+(billType%4)+']').prop('checked','checked');
        }else{
            var a = 3;
            $('input[name="acntType"][value='+a+']').prop('checked','checked');
        }
        if(billType == 1 || billType == 5){
            billType = 1;
        }else if(billType == 2 || billType == 6){
            billType = 2;
        }

        $('input[name="acntType"]').on('change',function(){
            var billType = $('input[name="acntType"]:checked').val();
            for(var i =1 ; i<=maxDepth;i++){
                var param = {acntCode : billType, depth : i,mode : mode};
                call_acnt_list(param);
            }

        });

        for(var i =1 ; i<=maxDepth;i++){
            var param = {acntCode : billType, depth : i,mode : mode};
            call_acnt_list(param);
        }

        $('.acnt_select_depth').change(function () {
            var select_obj = $(this);
            select_depth(select_obj);
        });
        $('#acntCodePanel').modal('show');

    };

    var select_depth = function(select_obj){
        var depth = select_obj.data('depth');
        remove_options(depth);
        var acntCode = select_obj.val();
        var param = {
            acntCode : acntCode
            ,depth : (depth+1)
            ,mode : mode
        };
        call_acnt_list(param);

        var opt = select_obj.find('option[value="'+acntCode+'"]');
        checked_acnt(acntCode,depth,opt.data('hasChild'),opt.text());
    };

    var checked_acnt = function(acntCode,depth,hasChild,name){
        selectedObj = {
            hasChild : hasChild
            ,acntCode : acntCode
            ,acntName : name
            ,depth : depth
        };
    };

    var remove_options = function(depth){

        for(var i=depth+1 ;i<=5;i++){
            $('#acnt_select_depth'+i).find('option').remove();
        }
    };

    var call_acnt_list = function(param){

        var menuUrl = menuName === 'donation' ? menuName : 'bill';
        $.post('/bill/'+menuUrl+'/get_acnt_list',param,function(data){
            try{
                var list = eval('('+data+')');
                $('#acnt_select_depth'+param.depth).find('option').remove();

                if(list.length > 0){
                    $('#acnt_select_depth'+param.depth)
                        .append($("<option></option>")
                            .attr("value",'')
                            .data('depth',param.depth)
                            .addClass('hasChild1')
                            .data('hasChild',1)
                            .text('-선택-'));
                    $.each(list, function(key, value) {

                        $('#acnt_select_depth'+param.depth)
                            .append($("<option></option>")
                                .attr("value",value.code)
                                .data('depth',value.depth)
                                .addClass('hasChild'+value.hasChild)
                                .data('hasChild',value.hasChild)
                                .text(value.name));
                    });
                }else{
                }



            }catch(e){
                return;
            }
        });
    };

    return {
        init : function(acntNameTag,acntCodeTag,depth,modeFlag){
            mode = modeFlag;
            maxDepth = depth;
            selector = {
                acntNameTag : acntNameTag
                ,acntCodeTag : acntCodeTag
            };

            if(maxDepth > 0){
                for(var i = maxDepth+1;i<=5;i++){
                    $('#acnt_select_depth'+i).hide();
                }
            }
            init();
        }
        ,adjust : function(e, acntCallBack){

            e.preventDefault();

            if(typeof(selectedObj.hasChild) == 'undefiend'){
               MessageBox.alert('계정선택에 오류가 있습니다.');
            }else{

                if(selectedObj.hasChild == 1){
                   MessageBox.alert('최하위 계정과목만 적용할 수 있습니다.');
                }else{
                    $(selector.acntNameTag).val(selectedObj.acntCode);
                    $(selector.acntCodeTag).val(selectedObj.acntName);

                    if(typeof(acntCallBack) == 'function'){
                        acntCallBack();
                    }

                    // 헌금과 지출이 다른 모달을 쓰기 때문에..발생
                    $('#acntCodePanel').modal('hide');
                    // if($.modal !== undefined && $.modal.close !== undefined){
                    //     $.modal.close();
                    // }else{
                    //     $('#acntCodePanel').modal('hide');
                    // }
                }
            }

            return false;
        }
    }
})();
