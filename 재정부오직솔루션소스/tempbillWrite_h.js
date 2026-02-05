
// 원래 있었던 expend_modify 를 좀 정리 하기 위함 중복 코드 리팩토링.
// 초기에 재정청구서 입력 화면을  수정모드로 진입시 기존 전표를 가져오는 역할
var expend_edit = (function(){

    var copy_mode = null;
    var modify = false;

    // @param code 복사작성일 경우엔 코드앞에 c가 붙음.
    var init = function (code){
        if(code == 'income' || code == ''){
            MessageBox.alert('잘못된 접근입니다.');
            error_move();
            return;
        }


        $("#innerTable").html('');
        if(code.substr(0,1) == 'c') {
            code = code.substr(1);
            expend_edit.copy_mode = 1;
        }else{
            expend_edit.copy_mode = 0;
        }

        get_expend_list_data(code);

    };


    // ajax 로 데이터 값 불러옴.
    var get_expend_list_data = function(code){

        $.post("/bill/tempBill/get_modify_expend_list", {code :code }, function(reData) {
            if(reData) {
                var jsonData = $.parseJSON(reData);
                var budget_calc_mode;
                $("#contentForm").show();

                if(jsonData.expend.origin_code)
                {
                    replace_code = jsonData.expend.origin_code;
                    replace_money = jsonData.expend.origin_money;
                }

                // 수정모드
                if(expend_edit.copy_mode == 0){
                    modify = true;
                    $("#modify_button").text('청구서 수정완료');   // 버튼의 텍스트 수정
                    $("#refresh_button").show();

                    budget_calc_mode = 1;
                    if(jsonData.expend.origin_code != null){
                        $("#bank").prop('disabled',true);
                        $("#holder").prop('disabled',true);
                        $("#account_no").prop('disabled',true);
                        $("#uName").prop('disabled',true);
                        $("#acntName").prop('disabled',true);
                    }
                }else if(expend_edit.copy_mode == 1){	// 복사 작성 모드
                    budget_calc_mode = 0;
                }

                set_edit_table(code, jsonData,reData,budget_calc_mode, jsonData.expend.write_input_type);
            }else{
                error_move();
            }
        });

    };

    // 읽어온 값을 입력 테이블에 채워줌.
    var set_edit_table = function(code, jsonData,reData,budget_calc_mode, write_input_type){
        var expend_data = jsonData.expend;

        $("#write_tabs").customizeTabs("#write_tabs_content","#write_tab_change_content","#tab"+write_input_type);

        // 수정모드일 땐 원래 전표의 날짜로 입력, 복제 작성일 경우 오늘 날짜로 작성.(기본이 오늘날짜로 되어있으므로 아무것도 안해도 됨)
        if(expend_edit.copy_mode == 0) {
            var billDate = jsonData.expend.billDate.split('-').join('');
            $('#date').val(billDate);
        }

        if(write_input_type == 1){	// 일반 작성방식.
            temp_inputOn();
            CDVList.modifyTr(reData,code);
            sumMoney();
        }
        else if(write_input_type == 3){	// 오륜교회, 계좌 고정
            temp_inputOn();
            CDVList.modifyTr(reData,code);
            sumMoney();
        }else{							// 기안문형식
            CDVList.setTempBillList(reData,code);
        }

        calc_budget(budget_calc_mode);

        if(write_input_type == 1 || write_input_type ==2 ){
            $('#replace_bank').val(expend_data.bank);
            $('#replace_account').val(expend_data.account_no);
            $('#replace_holder').val(expend_data.holder);
        }else if(write_input_type ==3){
            if(expend_data.bankID == 0 ){
                $('#parent_bank').prop('disabled',true);
                $('#parent_holder').prop('disabled',true);
                $('#parent_account_no').prop('disabled',true);
            }else{
                $('#parent_bank').val(expend_data.bank);
                $('#parent_holder').val(expend_data.holder);
                $('#parent_account_no').val(expend_data.account_no);
            }
            $('#parent_memType').val(expend_data.memType);
            $('#parent_pid').val(expend_data.pid);
            $('#parent_receiver').val(expend_data.name);
            $('#parent_bankName').val(expend_data.bank_name);
            $('#parent_bankID').val(expend_data.bankID);
        }

    };

    var error_move = function (){
        WindowLocation.href = '/bill/tempBill/listView/income?print_mode=2';
    };
    var get_modify_flag = function(){
        return modify;
    };

    return {

        init : init
        ,modify : modify
        ,get_modify_flag : get_modify_flag
        ,copy_mode : copy_mode

    };
})();