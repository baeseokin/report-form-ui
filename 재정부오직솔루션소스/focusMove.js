
/*
 *	입력순서 결정하는 체크 박스를 클릭할 때 변경 되도록 설정.
 */
var inputSeqCheck = {
    seqIndexValue : new Array()
    ,init : function( checkBoxHeader, formName, tabIndex , seqSetting, mode, exceptClassName = ''){
        var self = this;
        this.inputCheckBox = $(checkBoxHeader).find('input:checkbox');
        if(exceptClassName != '') {
            this.inputCheckBox = this.inputCheckBox.add($("." + exceptClassName))
        }
        inputSeqCheck.seqIndexValue = seqSetting;	 // 초기 포커스 이동순서를 세팅 해줌.

        this.inputCheckBox.each(function() {
            var id = this.id.split("check_").join("");
            var status = self.seqIndexValue[id] == 1 ? true : false;

            if(status){
                $(this).attr('checked',status);
                $('#'+id).attr("tabMoveIndex",tabIndex);
            }else{
                $('#'+id).removeAttr("tabMoveIndex");
            }
        });

        // 입력순서 체크박스 클릭
        this.inputCheckBox.click(function() {


            var id = this.id.split("check_").join("");

            if(this.checked){
                $('#'+id).attr("tabMoveIndex",tabIndex);
            }else{
                $('#'+id).removeAttr("tabMoveIndex");
            }

            focusMove.resetFocusInput(formName, tabIndex);	// 각 input 태그에 붙은 index 번호를 재설정.


            // db에 저장시키는 것은 아직 하지 않음.
            if(this.checked==true){
                check = 1;
            }else{
                check = 0;
            }
            self.seqIndexValue[id] = check;
            if(mode=='bill'){
                var seqIndexValueObject = JSON.parse(JSON.stringify(self.seqIndexValue));
                delete seqIndexValueObject.billText;
                $.post('/bill/bill/saveInputMode', {
                    seqIndexValue : seqIndexValueObject
                }, function(data) {
                    if(data == 'error') {
                        MessageBox.alert('현재 입력설정을 저장할 수 없습니다.');
                    } else if(data == false) {
                        MessageBox.alert('데이터베이스 저장에 실패하였습니다.');
                    }
                });
            }else if(mode=='donation'){
                $.post('/bill/donation/saveInputMode', {
                    seqIndexValue : self.seqIndexValue
                }, function(data) {
                    if(data == 'error') {
                        MessageBox.alert('현재 입력설정을 저장할 수 없습니다.');
                    } else if(data == false) {
                        MessageBox.alert('데이터베이스 저장에 실패하였습니다.');
                    }
                });
            }else if(mode=='tempBill'){
                $.post('/bill/tempBill/saveInputMode', {
                    seqIndexValue : self.seqIndexValue
                }, function(data) {
                    if(data == 'error') {
                        MessageBox.alert('현재 입력설정을 저장할 수 없습니다.');
                    } else if(data == false) {
                        MessageBox.alert('데이터베이스 저장에 실패하였습니다.');
                    }
                });
            }
        });


    }


}


/*
 *	포커스를 지정한 index 끼리만 움직이도록 한다.
 */

selectSummary = 0;

var focusMove = {
    nowIndex: null
    , shiftKeyOn: false
    , maxIndex: null
    , init: function (formName, index, submitOption, exceptClassName = '') {
        var allInputObj = $(formName).find("input:text:visible");
        if(exceptClassName != '') {
            allInputObj = allInputObj.add($("." + exceptClassName))
        }
        var self = this;
        this.submitCbFunc = submitOption;

        this.maxIndex = allInputObj.length - 1;

        allInputObj
            .focus(function () {
                self.nowIndex = $(this).attr("indexNo");
            })
            .keydown(function(event){

                var keyCode = event.keyCode;
                if(event.shiftKey == false && (keyCode == 9 || keyCode == 13) ){	// 전진
                    if(selectSummary==1){
                        selectSummary++;
                        return false;
                    }
                    var thisInputObj = this;

                    self.findNextNum(parseInt($(this).attr("indexNo")), keyCode,thisInputObj, function(nextIndex){
                        if(nextIndex > -1){
                            allInputObj.get(nextIndex).select();
                        }
                    });

                    return false;
                }

            })
            .each(function(index){
                $(this).attr("indexNo",index);		// 해당 input 의 index 넘버를 지정 해줌.
            });

        this.resetFocusInput(formName, index, exceptClassName);

    }
    /*
     *	포커스 이동 체크된 input 박스들이 어떤것인지 갱신한다.
     */
    ,resetFocusInput : function(formName, index, exceptClassName = ''){
        this.indexObj = $(formName).find("input:text[tabMoveIndex="+index+"]:visible");
        if(exceptClassName != '') {
            this.indexObj = this.indexObj.add($("." + exceptClassName))
        }
        this.firstIndex = $(this.indexObj.get(0)).attr('indexNo');

    }
    /*
     *	tabMoveINdex 속성이 있는 input 을 돌면서 현재 포커스가 위치해 있는 input 보다 높은 index 값이 있는지 확인 해서 그 index를 리턴한다.
     */
    ,findNextNum : function(index, keyCode, thisInputObj, callbackFunc){



        if( $(thisInputObj).attr("passThisObj") == "block" ){	// 전표 분류 때문에 해놓은 것인데. 특정조건에 focus 이동 안되게끔.
            $(thisInputObj).blur();
            $(thisInputObj).select();
            return false;
        }

        var findIndex = -1;

        this.indexObj.each(function(){
            var indexNo = $(this).attr("indexNo");

            if(findIndex == -1 && index < indexNo){		// 최초 한번만 저장하게 하려고 이렇게 함. index 보다 큰 첫 indexNo 를 구하기.
                findIndex = indexNo;
            }
        });


        if(findIndex == -1){	// 못찾았을 경우.

            if(thisInputObj.id == 'amount3' && (keyCode == 9 || keyCode == 13))
            {
                $("#sumName3").focus();
                return;
            } else if(thisInputObj.id == 'sumName3' && keyCode == 13) {
                if($("#child_account_name").val() == '')
                {
                    $("#child_account_name").focus();
                    return;
                }
                if($("#amount3").val() == '')
                {
                    $("#amount3").focus();
                    return;
                }
                if($("#sumName3").val() == '')
                {
                    $("#sumName3").focus();
                    return;
                }
            } else {
                var self = this;
                var callFunc;
                if (typeof (this.submitCbFunc) != 'undefined') {
                    callFunc = this.submitCbFunc;

                } else if (typeof (_submit) != 'undefined') {
                    callFunc = _submit;
                }

                if (callFunc == null) {
                    console.dir('focus move need submit function');
                } else {
                    callFunc.call(this, function (re) {
                        if (re === true) {
                            sAlert("전표가 입력되었습니다.");
                            endInput();
                            //return self.firstIndex;
                            callbackFunc(self.firstIndex);
                        } else {
                            //return -1;
                            callbackFunc(-1);
                        }
                    });
                }
            }
        }else{
            callbackFunc(findIndex);
        }
    }
}