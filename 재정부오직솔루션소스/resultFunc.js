/*
 * 현금전표 입력에서 전표 분류를 지정시
 */
function adjustDonationType(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#billType').val(data.no);
        $('#billText').removeAttr("passThisObj");	// focusMove 에서 간혹 포커스 이동을 제재 해야할 경우 활용.
        inputOn();

        if ($('#bankName').val() == '' || $('#bankID').val() == '') {
            $('#bankName').val('현금');
            $('#bankID').val('0');
        }

    } else {
        $('#billText').val("");
        $('#billType').val("");
        $('#bankName').val("");
        $('#bankID').val("");
        $('#billText').attr("passThisObj", "block");
        //$('#billText').blur().focus();				// 선택 목록 재 활성화를 위해서.
        inputOff();
    }
}
/*
 * 예약 전표입력에서 예약 구분 지정시
 */
function adjustReservationType(sObj) {

    if (sObj.selectDataIndex >= 0) {

        var data = sObj.list.data[sObj.selectDataIndex];

        $('#category_name').val(data.category_name);
        $('#reservationText').val(data.category_name);
        $('#reservationText').removeAttr("passThisObj");
//		inputOn();

    } else {

        $('#reservationText').attr("passThisObj", "block");
    }

}
/*
 * 성도/거래처 목록에서 은행명 지정시
 * */
function adjustBankCode(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#bankName').val(data.name);
        $('#standardCode').val(data.code);

    } else {
        $('bankName').val('');
        $('#standardCode').val('');
    }
}

/*
 * 예약 전표입력에서 예약 구분 지정시
 */
function adjuststandard_bank(sObj) {

    if (sObj.selectDataIndex >= 0) {

        var data = sObj.list.data[sObj.selectDataIndex];

        $('#bank').val(data.name);
        $('#standard_code').val(data.code);

//		inputOn();

    } else {
        $('#bank').val('');
        $('#standard_code').val('');
        $('#bank').attr("passThisObj", "block");
    }

}

/*
 * 일반 전표입력에서 전표 분류를 지정시
 */
function adjustBillType(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        $('#billType').val(data.no);
        $('#billText').removeAttr("passThisObj");	// focusMove 에서 간혹 포커스 이동을 제재 해야할 경우 활용.
        inputOn();

        /*		if(data.no == 3 || data.no == 4){
         $('#bankName').prop("disabled",true).val('선택없음');
         }else{
         $('#bankName').prop("disabled",false).val('현금');
         }
         */

        if(churchCode==4726){
            setAccountChange.setBillType(data.no);
        }

        $('#billText').on('click', function () {
            $('#acntName').val('');
        });

        if ($('#bankName').val() == '' || $('#bankID').val() == '') {
            /*			if(data.no == 3 || data.no == 4){
             $('#bankName').val('선택없음');
             $('#bankID').val('0');
             return;
             }*/
            $('#bankName').val('현금');
            $('#bankID').val('0');
        }
        var money = $.trim($('#amount').val()) != "" ? $.trim($('#amount').val()) : $.trim($('#amount2').val());
        dcAct.dcBillTypeCheck(data.no, String(money).split(",").join(""));

    } else {
        $('#billText').val("");
        $('#billType').val("");
        $('#bankName').val("");
        $('#bankID').val("");
        $('#billText').attr("passThisObj", "block");
        //	$('#billText').blur().focus();				// 선택 목록 재 활성화를 위해서.
        inputOff();
    }

}


// 오륜교회에서 입금시 수입계정과목만 지출시 비용계정과목만 표기를 원해서 수정.
var setAccountChange = (function(){
    var originAccountData;

    return {
        init : function(){
            originAccountData = accountListData.data;
        }
        ,setBillType : function(billType){
            accountListData.data = originAccountData;

            if(billType <= 2){

                var data;
                var list = new Array();
                for(var i in accountListData.data){
                    data = accountListData.data[i];
                    if(typeof(data.code) == 'string' && data.code.indexOf(billType) ===0){
                        list.push(data);

                    }
                }
                accountListData.data = list;
            }
        }
    }
})();


$(function(){
    if(typeof(menuName)!='undefined' && menuName=='bill' && typeof(churchCode)!='undefined' && churchCode==4726) {
        // setAccountChange.init();
    }
});


function sc_adjustBillType(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        $('#billType').val(data.no);
        $('#billText').removeAttr("passThisObj");	// focusMove 에서 간혹 포커스 이동을 제재 해야할 경우 활용.
        inputOn();

        var money = $.trim($('#amount').val()) != "" ? $.trim($('#amount').val()) : $.trim($('#amount2').val());
        dcAct.dcBillTypeCheck(data.no, String(money).split(",").join(""));
    } else {
        $('#billText').val("");
        $('#billType').val("");
        $('#billText').attr("passThisObj", "block");
        //$('#billText').blur().focus();				// 선택 목록 재 활성화를 위해서.
        inputOff();
    }
}

/*
 * 이름 선택시
 */
function adjustName(sObj) {
    adjustNameOrigin(sObj, "");
}

function sc_adjustName(sObj) {
    adjustNameOrigin(sObj, "sc_");
}

function sc_mutil_adjustName(sObj) {
    var getPidFlag = false;
    var iobj = $(sObj.inputObj);
    if (sObj.selectDataIndex >= 0) {
        $("#sc_pid").val(0);
        $("#sc_name").val("");
        $(".sc_memType[value=0]").prop('checked', true);
        $(".sc_memType[value=1]").prop('checked', true);
        $(".sc_memType[value=2]").prop('checked', true);
        $(".sc_memType[value=3]").prop('checked', true);
        var data = sObj.list.data[sObj.selectDataIndex];
        if (data.no == 0) {
            resetName();
        } else {
            $("#sc_pid").val(data.no);
            $("#sc_name").val(data.name);
            if (data.memType == 0) {
                $(".sc_memType[value=0]").prop('checked', true);
                $(".sc_memType[value=1]").prop('checked', false);
                $(".sc_memType[value=2]").prop('checked', false);
                $(".sc_memType[value=3]").prop('checked', false);
            }
            else if (data.memType == 1) {
                $(".sc_memType[value=0]").prop('checked', false);
                $(".sc_memType[value=1]").prop('checked', true);
                $(".sc_memType[value=2]").prop('checked', false);
                $(".sc_memType[value=3]").prop('checked', false);
            }
            else if (data.memType == 2) {
                $(".sc_memType[value=0]").prop('checked', false);
                $(".sc_memType[value=1]").prop('checked', false);
                $(".sc_memType[value=2]").prop('checked', true);
                $(".sc_memType[value=3]").prop('checked', false);
            }
            else if (data.memType == 3) {
                $(".sc_memType[value=0]").prop('checked', false);
                $(".sc_memType[value=1]").prop('checked', false);
                $(".sc_memType[value=2]").prop('checked', false);
                $(".sc_memType[value=3]").prop('checked', true);
            }
        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetName();
    }
}


function adjustNameOrigin(sObj, preFix) {
    var getPidFlag = false;
    var iobj = $(sObj.inputObj);
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        if (data.no == 0) {
            $("#info_id").text("");
            $("#info_depth2").text("");
            $("#info_depth3").text("");
            $("#info_birth").text("");
            $("#info_cellphone").text("");
            resetName(preFix, "0");

        } else {

            var memType = $('.memTypeRadio:checked').val();

            $("#" + preFix + "name1Tag").attr('class', 'memType' + memType);
            $("#" + preFix + "memType").val(memType);
            $("#" + preFix + "pid").val(data.no);
            $("#" + preFix + "tid").val(data.tid);
            $("#" + preFix + "birthYear").val(data.birthYear);
            $("#" + preFix + "birthDay").val(data.birthDay);
            $("#" + preFix + "groupName").val(data.groupName);

            var partner = typeof(data.partner_name) == 'undefined' ? '' : data.partner_name;
            if (inputSeqCheck.seqIndexValue[preFix + 'uName2'] == 1) {
                $("#" + preFix + "uName2").val(partner);
                $("#" + preFix + "uName2").select();
            }
            $("#" + preFix + "info_block").css('display', 'block');
            printAdjustName(data, preFix);
        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetName();
    }
}

function printAdjustName(data) {
    resetInfoBlock();
    var info_id = data.pid == 0 ? '' : data.pid;
    if(Boolean(data['family_no'])) {
        info_id += " | " + data['family_no'];
    }
    var name = data.name;
    if(Boolean(data['member_name_en'])) {
        name += " | " + data['member_name_en'];
    }
    $("#info_id").text(info_id);
    $("#info_name").text(name);
    if (isValidDate(data.birth)) {
        //format 변경

        var replacedBirth = data.birth;
        replacedBirth = replacedBirth.replace(/\(\+\)|\(\-\)/gi, '');
        var date = new Date(replacedBirth);

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var date = date.getDate();
        var birthSolar = '';
        if(data.birth_solar) {
            birthSolar = data.birth_solar == 2 ? "(+)" : "(-)";
        }
        var newDateToText =  year + "-" + month + "-" + date + birthSolar;

        $("#info_birth").text(newDateToText);
    } else {
        $("#info_birth").text("");
    }

    data.name2 ? $("#info_partner").text("(" + data.name2 + ")") : $("#info_partner").text("");
    data.depth1_name != null ? $("#info_depth1").text(data.depth1_name) : $("#info_depth1").text("");
    data.depth2_name != null ? $("#info_depth2").text(data.depth2_name) : $("#info_depth2").text("");
    data.depth3_name != null ? $("#info_depth3").text(data.depth3_name) : $("#info_depth3").text("");
    data.member_cellphone != null ? $("#info_cellphone").text(data.member_cellphone) : $("#info_cellphone").text("");

    $("#info_block").css('display', 'block');
}

function adjustNameMA(sObj) {
    var getPidFlag = false;
    var iobj = $(sObj.inputObj);
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        if (data.no == 0) {

            resetName();

        } else {
            var memType = $('.memTypeRadio:checked').val();


            $('#name1Tag').attr('class', 'memType' + memType);
            $('#memType').val(memType);
            $('#pid').val(data.no);
            $('#tid').val(data.tid);
            $('#birthYear').val(data.birthYear);
            $('#birthDay').val(data.birthDay);
            $('#groupName').val(data.groupName);

            var partner = typeof(data.partner_name) == 'undefined' ? '' : data.partner_name;
            if (inputSeqCheck.seqIndexValue['uName2MA'] == 1) {
                $('#uName2MA').val(partner);
                $("#uName2MA").select();
            }

        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetName();
    }
}
/*
 *	이름값 변경시
 *	의도 한 것 아닌데 신기하게 유효한 값을 선택하면 이 메쏘드 실행 안시켜서 초기화 안시키고 그렇지 않고 변화시키면 초기화 시킨다.
 */
function resetName(prefix = "", pid = '') {

    $('#'+ prefix + 'name1Tag').attr('class', 'memType0');
    $('#' + prefix + 'pid').val(pid);
    $('#' + prefix + 'tid').val('');
    $('#' + prefix + 'birthYear').val("");
    $('#' + prefix + 'birthDay').val("");
    $('#' + prefix + 'groupName').val("");
    $('#' + prefix + 'memType').val('');
    $('#' + prefix + 'uName2').val("");


    resetInfoBlock();

}

function resetInfoBlock() {

    $('#info_block .info span').html('');
    $('#info_photo').css('backgroundImage', '');
}

/*
 * 계정코드 등록시
 */
var typeDtmnAcnt = false;
function adjustAccount(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#acntCodeTemp').val(data.code); //2012-08-17 no를 code로 수정
        $("#depth1").val(data.depth1);
        $("#depth2").val(data.depth2);
        $("#depth3").val(data.depth3);
        $("#account_summary").text(data.parentAccountSummary);

        typeDtmnAcnt = false;
        if(typeof useDtmnAcnt != 'undefined' && useDtmnAcnt == true) {
            if(typeof data.campaign_idx != 'undefined' && data.campaign_idx > 0) {
                typeDtmnAcnt = true;
            }
        }
        
        if (typeof findPartAccount != 'undefined'){
            findPartAccount(data);
        }
        if (typeof acntInfomation == 'function') {
            acntInfomation(data['code']);
        }
    } else {
        $('#acntCodeTemp').val("");
        $('#acntName').val("");
    }
    getAccountSum();
}

function adjustChildAccount(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $("#child_account_code").val(data.code);
    } else {
        $('#acntCodeTemp').val("");
        $('#acntName').val("");
    }
}

function adjustAccountLoadBudget(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#acntCodeTemp').val(data.code); //2012-08-17 no를 code로 수정
        $("#depth1").val(data.depth1);
        $("#depth2").val(data.depth2);
        $("#depth3").val(data.depth3);

        /*if( (data.code+"").substring(0,1) == "1" || (data.code+"").substring(0,1) == "2" || data.code == '3010100' || data.code == '4010300' || data.code == '3010300' || data.code == '3012300')
         {

         $("#bankName").prop("disabled",false).val('현금');
         }
         else
         {
         $("#bankName").prop("disabled",true).val('선택없음');
         }*/

    } else {
        $('#acntCodeTemp').val("");
        $('#acntName').val("");
    }
    getAccountSum();
    calc_budget();
}


/*
 * 부모계정코드 등록시
 */
function adjustParentAccount(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#parent_code').val(data.code); //2012-08-17 no를 code로 수정

    } else {
        $('#parent_code').val("");
        $('#ParentacntName').val("");
    }
    getAccountSum();
}


function adjustAccountMA(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#acntCodeTempMA').val(data.code); //2012-08-17 no를 code로 수정
        $("#depth1MA").val(data.depth1);
        $("#depth2MA").val(data.depth2);
        $("#depth3MA").val(data.depth3);
        $('#check_ma_acntName').prop('checked', true);

    } else {
        $('#acntCodeTempMA').val("");
        $('#ma_acntName').val("");
        $('#check_ma_acntName').prop('checked', false);
    }
    getAccountSum();
}

function sc_adjustAccount(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        if (data.code > 0) {
            $('#sc_acntCode').val(data.code);
            $('#sc_depth').val(data.depth);
            $('#sc_account_summary').text(data.parentAccountSummary);
        } else {
            $('#sc_acntCode').val("");
            $('#sc_acntName').val("");
            $('#sc_depth').val("");
        }
    } else {
        $('#sc_acntCode').val("");
        $('#sc_acntName').val("");
        $('#sc_depth').val("");
    }
}


function sc_adjustPart(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        if (data.code > 0) {
            $('#sc_part').val(data.code);
            $('#sc_partName').val(data.name);
        } else {
            $('#sc_part').val("");
            $('#sc_partName').val("");
        }
    } else {
        $('#sc_part').val("");
        $('#sc_partName').val("");
    }
}

function sc_adjustTag(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        if (data.code > 0) {
            $('#sc_acntCode').val(data.code);

        } else {
            $('#sc_acntCode').val("");
            $('#sc_acntName').val("");

        }
    } else {
        $('#sc_acntCode').val("");
        $('#sc_acntName').val("");
        $('#sc_depth').val("");
    }
}


/*
 * 은행 등록시
 */
function adjustBank(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        $('#bankID').val(data.no);
        $('#currency_flag').val(data.currency_flag);


        if(data.no == 0){
            $("#bank").val('').prop("disabled", true).attr('selectno','').attr('selectname','');
            $("#holder").val('').prop("disabled", true).attr('selectno','').attr('selectname','');
            $("#account_no").val('').prop("disabled", true);
        }else{
            $("#bank").prop("disabled", false);
            $("#holder").prop("disabled", false);
            $("#account_no").prop("disabled", false);
        }

        /*
         if(data.name==''){
         $('#bankName').val(data.bankName);
         }
         */
    } else {
        $('#bankID').val("");
        $('#bankName').val("");
        $('#currency_flag').val("");
    }
}

function adjustBank2(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        $('#parent_bankID').val(data.no);

        if(data.no == 0){
            $("#parent_bank").val('').prop("disabled", true).attr('selectno','').attr('selectname','');
            $("#parent_holder").val('').prop("disabled", true).attr('selectno','').attr('selectname','');
            $("#parent_account_no").val('').prop("disabled", true);
        }else{
            $("#parent_bank").prop("disabled", false);
            $("#parent_holder").prop("disabled", false);
            $("#parent_account_no").prop("disabled", false);
        }

    } else {
        $('#bankID').val("");
        $('#bankName').val("");
        $('#currency_flag').val("");
    }
}


function adjustBankMA(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#ma_bankID').val(data.no);
        $('#check_ma_bankName').prop('checked', true);
        /*
         if(data.name==''){
         $('#bankName').val(data.bankName);
         }
         */
    } else {
        $('#ma_bankID').val("");
        $('#ma_bankName').val("");
        $('#check_ma_bankName').prop('checked', false);
    }
}

function sc_adjustBank(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        $('#sc_bankID').val(data.no);
        $('#currency_flag').val(data.currency_flag);
        /*
         if(data.name==''){
         $('#sc_bankName').val(data.bankName);
         }
         */
    } else {
        $('#sc_bankID').val("");
        $('#sc_bankName').val("");
        $('#currency_flag').val("");
    }
}
/*
 * 예배 등록시
 */
function adjustWorship(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#worshipCode').val(data.no);
    } else {
        $('#worshipCode').val("");
        $('#worshipName').val("");
    }

}
function adjustWorshipMA(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#worshipCodeMA').val(data.no);
        $('#check_ma_worshipName').prop('checked', true);
    } else {
        $('#worshipCodeMA').val("");
        $('#ma_worshipName').val("");
        $('#check_ma_worshipName').prop('checked', false);
    }

}
function sc_adjustWorship(sObj) {

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        if (data.no > 0) {
            $('#sc_worshipCode').val(data.no);
        } else {
            $('#sc_worshipCode').val("");
            $('#sc_worshipName').val("");
        }
    } else {
        $('#sc_worshipCode').val("");
        $('#sc_worshipName').val("");
    }
}

/*
 * 기부금 영수증 용 이름 선택시
 */
function adjustNameForTax(sObj) {
    var getPidFlag = false;
    var iobj = $(sObj.inputObj);
    //var v = $("input[name=zipcode_flag]:checked").attr("value");

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        resetNameForTax();
        $("#pid").val(data.no);
        $("#donator").val(data.name);
        $("#tid").val(data.tid);
        $("#applicant").val(data.donation_name);


        if (data.rrn_id1 != null && data.rrn_id2 != null)
            $("#securityNum").val(data.rrn_id1 + '-' + data.rrn_id2);

        if (data.no > 0) {
            $("#tid").val(data.tid);

            if (data.zipcode == null || data.zipcode == "") {
                $("#zipcode1").val("");
                $("#address1").val(data.addr);
            } else {
                $("#zipcode1").val(data.zipcode.replace("-", ""));
                $("#address1").val(data.addr);
            }

            if (data.zipcode2 == null || data.zipcode2 == "") {
                $("#zipcode2").val("");
                $("#address2").val(data.addr2);
            } else {
                $("#zipcode2").val(data.zipcode2.replace("-", ""));
                $("#address2").val(data.addr2);
            }

        } else {
            $("#tid").val(0);
            $("input[name=memType]").attr("checked", false);
            $("#memTypeRadio0").attr("checked", true);
            $("#donationTypePID").attr("checked", true);
            $("#donationTypeFID").attr("disabled", true);
//			$("#addMem0").attr("disabled", true);
        }
        var spot_option = $("#spot_option").is(":checked");
        if (!spot_option)
            setDonationList();
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetNameForTax();
    }
}

function resetNameForTax() {
    $("#pid").val("");
    $("#tid").val("");
    $("#donationList").html("");
    $("#fdonationList").html("");
    $("#PIDSum").html("");
    $("#FIDSum").html("");
    $("#money").val("");
    $("#securityNum").val("");
    $("#zipcode1").val("");
    $("#zipcode2").val("");
    $("#zipcode3").val("");
    $("#zipcode4").val("");
    $("#address1").val("");
    $("#address2").val("");
    $("#applicant").val("");
}

/* * 가상계좌 추가에서.. 성도 이름 선택시..
 */
function adjustNameForGetInfo(sObj){
    var data = sObj.list.data[sObj.selectDataIndex];
    $("#popName").val(data.name);
    $("#uName").val(data.name);
    $("#popPnum").html(data.member_cellphone);
    $("#popBirth").html(data.birth);
    $("#pid").val(data.no);
    $("#tid").val(data.tid);
}

function adjustDeterminatorForGetInfo(sObj){

    var data = sObj.list.data[sObj.selectDataIndex];

    $(".pop_body input:text[name=name]").val(data.name);
    $(".pop_body input:text[name=determinator_phone]").val(data.member_cellphone);
    $(".pop_body input[name=phone]").val(data.member_cellphone);
    $(".pop_body input:text[name=determinator_birth_date]").val(data.birth);
    $(".pop_body input[name=pid]").val(data.no);
    $(".pop_body input[name=mem_type]").val(1);
    $(".pop_body input[name=tid]").val(data.tid);

}

/*
 * 성도/거래처 등록 이름 선택시
 */
function adjustNameForRegMember(sObj) {

    var getPidFlag = false;
    var iobj = $(sObj.inputObj);

    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        if (data.no == 0) {

            resetNameForRegMember();

        } else {
            var memType = $('.memTypeRadio:checked').val();
            var groupName = "";
            if (data.no != null && data.no != "교적" && data.no != "New") {
                $("#name").focus();
                MessageBox.alert("이미 등록된 성도입니다.");
                return false;
            }
            else if (data.no == null) {
                $("#name").focus();
                MessageBox.alert("성도를 선택해주세요.");
                return false;
            }
            $('#pid').val(data.pid);
            $('#mem_tid').val(data.tid);
            if (data.birthYear2 > 0) {
                if (data.birthDay.length == 3) {
                    birthDay = data.birthYear2 + '0' + data.birthDay;
                } else {
                    birthDay = data.birthYear2 + data.birthDay;
                }
                $('#mem_birth').val(birthDay);
            }
            $('#addr').val(data.addr);
            $('#phone').val(data.member_cellphone);
            $('#mem_birth').val(data.birth);
            $('#envNo').val(data.env);
            $('#groupName').val(data.group_name);
            var partner = typeof(data.partner_name) == 'undefined' ? '' : data.partner_name;
            $('#partner_name').val(partner);
            groupName = data.depth3_name == "" ? data.depth2_name : data.depth3_name;
            $('#group_name').val(groupName);
            if (memType == 1) {
                cal_age();
            }
        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.

    }
}

function resetNameForRegMember() {
    $('#pid').val('');
    $('#mem_tid').val('');
    $('#addr').val('');
    $('#phone').val('');
    $('#mem_birth').val('');
    $('#mem_age').val('');
    $('#groupName').val('');
    $('#partner_name').val('');
}

/*지출결의서에서 사용*/
function adjustCustomer(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        if (data.no == 0) {
            resetCustomer();
        } else {
            var memType = 2;

            $('#name1Tag').attr('class', 'memType' + memType);
            $('#memType').val(memType);

            $('#pid').val(data.no);
            $('#uName').val(data.name);

            if($('#bankID').val() > 0){
                $('#bank').val(data.bankName);
                $('#account_no').val(data.accountNo);
                $('#holder').val(data.accountHolder);
                $('#standardCode').val(data.standardCode);
            }else{
                $('#bank').val('');
                $('#account_no').val('');
                $('#holder').val('');
                $('#standardCode').val('');
            }




        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetCustomer();
    }
}



/*지출결의서에서 은행코드 사용*/
function adjustStandardCode(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];

        if (data.no == 0) {
            resetCustomer();
        } else {
            var memType = 2;

            $('#standardCode').val(data.no);
        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
        resetCustomer();
    }
}


/*협동비에서 사용*/
function adjustAreaName(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];


        if (data.org_idx == 0) {
            resetCooperative();
        } else {

            $('#org_idx').val(data.org_idx);
            $('#area_name').val(data.depth3_name);
            $('#church_name').val(data.name);
            $('#minister_name').val(data.minister_name);
            $('#phone_number').val(data.phone_number);

        }
    } else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.

    }
}

function adjustBankAccount(sObj,a,b,c) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        var acntCode = data.code;
        $($(sObj.inputObj)[0]).siblings("input[name='acntCode[]']").val(acntCode);
        $($(sObj.inputObj)[0]).siblings("input[name='addAcntCode[]']").val(acntCode);
        inputOn();
        if ($('#bankName').val() == '' || $('#bankID').val() == '') {
            $('#bankName').val('현금');
            $('#bankID').val('0');
        }

    } else {
        $('#billText').val("");
        $('#billType').val("");
        $('#bankName').val("");
        $('#bankID').val("");
        $('#billText').attr("passThisObj", "block");
        //$('#billText').blur().focus();				// 선택 목록 재 활성화를 위해서.
        inputOff();
    }
}

function adjustCMSAccount(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $('#acntCode').val(data.code);
    } else {
        $('#acntCode').val("");
    }
}
function adjustCMSBankID(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        $("#bankName").val(data.bankName);
        $('#bankID').val(data.bankID);
    } else {
        $("#bankName").val("");
        $('#bankID').val("");
    }
}

function resetCustomer() {
    $('#name1Tag').attr('class', 'memType0');
    $('#memType').val('');
    $('#pid').val('');
    $('#bank').val('');
    $('#standardCode').val('');
    $('#account_no').val('');
    $('#holder').val('');
}


function resetCooperative() {

    $('#area_name').val('');
    $('#church_name').val('');
    $('#minister_name').val('');
    $('#phone_number').val('');
    $('#co_start_date').val('');
    $('#note').val('');
    $('#monthly_amount').val('');
}

/*
 * 계수자 선택시
 */
function adjustDonationChecker(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        // combine_view용 ID
        if ($('#donation_checker_id').length > 0) {
            $('#donation_checker_id').val(data.no);
        }
        // division_view용 ID
        if ($('#donationCheckerId').length > 0) {
            $('#donationCheckerId').val(data.no);
        }
        $('#donation_checker_id').val(data.no);
    } else {
        $('#donation_checker_id').val('');
        $('#donation_checker_name').val('');
        $('#donationCheckerId').val('');
        $('#donationCheckerName').val('');
        $('#donation_checker_id').val('');
    }
}

function sc_adjustDonationChecker(sObj) {
    if (sObj.selectDataIndex >= 0) {
        var data = sObj.list.data[sObj.selectDataIndex];
        if ($('#sc_donation_checker_id').length > 0) {
            $('#sc_donation_checker_id').val(data.no);
        }
    } else {
        $('#sc_donation_checker_id').val('');
        $('#sc_donation_checker_name').val('');
    }
}


