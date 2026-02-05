var shiftKey = false;//2012-03-16 김지연
function InputText(id){
	$(id).find('input:text').each(function(index){

		if(typeof(this.getAttribute('dataType')) != 'undefined'){
			
			$(this).keyup(function(event){ //2012-03-16  김지연
				if(!(shiftKey && event.keyCode == 189)){
					shiftKey = false;
				}
			});
			
			$(this).on('keydown',function(event){
				if(passKey(event.keyCode)){
					return true;
				}
				switch(this.getAttribute('dataType')){
					case 'money':
						if (event.keyCode == 229) {
							var regex = /[^0-9]/gi;
							var val = $(this).val();
							val = val.replace(regex, "");
							$(this).val(number_format(val));
							return true;
						}
						return moneyCheck(this, event.keyCode,event);
						break;
					case 'num':
						return numCheck(this, event.keyCode,event);
						break;
					case 'date':
						return dateCheck(this, event.keyCode, event);
						break;
					case 'phone' : 
						return phoneCheck(this, event.keyCode);
						break;
				}
			});

			$(this).keyup(function(event){
				var keyCode = event.keyCode;
				if( (keyCode>=96 && keyCode<=105 ) || (keyCode>= 48&& keyCode <= 57) || keyCode==189 || keyCode == 190 || keyCode == 110 ||  keyCode == 8 || keyCode == 46 ){
					switch(this.getAttribute('dataType')){
						case 'money':
							var cursor = this.selectionStart;
							var beforeAddCursor = ($(this).val().match(/,/g)||[]).length;
							var flag =moneyKeyUpCheck(this, event.keyCode);
							var addCursor = ($(this).val().match(/,/g)||[]).length;
							if((addCursor - beforeAddCursor) != 0)
							{
								if(keyCode != 46) {
									cursor = cursor + 1;
								}
							}
							this.setSelectionRange(cursor,cursor);
							return flag;
							break;
					}
					
				}

			});
		}
		
	});
}
function getCursorPosition(obj){
	obj = obj.jquery? obj[0] : obj;
	if(obj.getAttribute('selectionEnd') != null){
		return obj.selectionEnd;
	}
	else{	// IE
		var range = document.selection.createRange();
		var re = obj.createTextRange();
		var rc = re.duplicate();
		re.moveToBookmark(range.getBookmark());
		rc.setEndPoint('EndToStart', re);
		return rc.text.length;
	}
}

function selectRange(obj, start, end){
	if(obj.setSelectionRange){
		obj.focus();
		obj.setSelectionRange(start, end);
	}
	else if(obj.createTextRange){
		var range = obj.createTextRange();
		range.collapse(true);
		range.moveEnd('character', end);
		range.moveStart('character', start);
		range.select();
	}
}


// 편집에 사용되는 특수키들
function passKey(keyCode){
	switch(keyCode){
		case 8:				//backspace
		case 9:				//tab
		case 13:				//enter
		case 20:				//capsLock
		case 27:				//ESC
		case 33:				//pageup, down 2012-03-27 김지연
		case 34:
		case 35:				//END
		case 36:				//HOME
		case 37:				//arrowLeft
		case 38:				//arrowUp
		case 39:				//arrowRight
		case 40:				//arrowDown
		case 46:				//delete
		case 144:				//numLock
			break;	
		case 16:				//shift
			shiftKey=true; //2012-03-16  김지연
			break;
		default : 
			return false;
	}
	return true;
	
}

/*
* 소숫점 입력이 가능한 number_format
*/
function number_format(data){
	var prev_data="";

	if(Number(data)<0){
		prev_data="-";
		data=String(data).replace("-","");
	}

	var num_str=String(data);
	var tmp = '';
	var number = new Array;
	var cutlen = 3;
	var comma = ',';
	var nnn;
	var aaa;
	var number_format_str="";

	var data_ary=new Array();
	data_ary=num_str.split(".");

	for(aaa=0; aaa<data_ary.length; aaa++){
		if(!number[aaa]) number[aaa]="";

		var str=String(data_ary[aaa]);
		var len = str.length;
		var mod = (len % cutlen);
		var kkk = cutlen - mod;

		for (nnn=0; nnn<str.length; nnn++){
			number[aaa] = number[aaa] + str.charAt(nnn);
			if (nnn < str.length - 1){
				kkk++;
				if ((kkk % cutlen) == 0){
					number[aaa] = number[aaa] + comma;
					kkk = 0;
				}
			}
		}

		if(aaa>0) {
			if(number[aaa]!=0){
				number_format_str+="."+number[aaa].substr(0,2);
			}
		}else{
			number_format_str+=number[aaa];
		}
	}
	return prev_data+number_format_str;
}



function phoneCheck(obj, keyCode){
	switch (keyCode) {
		case 109: //	-	key
			if (obj.value.length > 0) {
				obj.value = obj.value + '-';
				return false;
			}
			else {
				return false;
			}
			break;
		case 189:	 //	백스페이스 바 왼쪽 - 
			if(!shiftKey) //김지연
				break;
		default:
			if( (keyCode>=96 && keyCode<=105 ) || (keyCode>= 48&& keyCode <= 57) ){
				return true;
			}

			try {
				sAlert('숫자와 -만 입력 가능합니다.');
			}
			catch(e){
			}
			return false;
			break;
	}
}

function moneyKeyUpCheck(obj, keyCode){
	if($("#auto_money").is(":checked")){
		obj.value = number_format(obj.value.split(".").join("").split(",").join(""));
	} 
	else{
		var moneyArray = obj.value.split(".");
		var moneyStr = "";
		var moneyStrCheck = "";
		if(moneyArray.length==1){
			moneyStr = number_format(moneyArray[0].split(",").join(""));
		}
		else if($.trim(moneyArray[1]) == ''){
			moneyStr = number_format(moneyArray[0].split(",").join(""))+".";
		}
		else{
			moneyStr = number_format(moneyArray[0].split(",").join(""))+"."+moneyArray[1].split(",").join("").substring(0,2);
		}
		moneyStrCheck = moneyStr;
		if(moneyStrCheck.substr(0,1) == "-" && Number(moneyStrCheck.split(",").join("")) == 0){
			obj.value = "";
			return false;
		}
		
		obj.value = moneyStr;
	}
}

function moneyCheck(obj, keyCode,event){
	switch (keyCode) {
		case 111: //  /	key
			if (obj.value.length > 0) {
				obj.value = number_format(obj.value.split(".")[0].split(",").join("") + '0000');
				return false;
			}
			else {
				return false;
			}
			break;
		case 106: // *	key
		case 107: // +	key
			if (obj.value.length > 0) {
				obj.value = number_format(obj.value.split(".")[0].split(",").join("") + '000');
				return false;
			} else {
				return false;
			}
			break;
		// case 109: // - key
		// 	if (obj.value.length > 0) {
		// 		obj.value = number_format(obj.value.split(".")[0].split(",").join("") + '00');
		// 		return false;
		// 	}
		// 	else {
		// 		return false;
		// 	}
		// 	break;
		case 189 : // backspace 옆 -key
			if (obj.value.length == 0) {
				obj.value = "-";
				return false;
			} else {
				sAlert('- 는 앞부분에 한번만 입력가능합니다.');
				return false;
			}
			break;
		default:

			if (!numCheck(obj, keyCode,event)) {
				sAlert('숫자와 NumPad의 /, *, - 만 입력 가능합니다..');	
				return false;
			}
			break;
	}
}

function numCheck(obj, keyCode,event){
	if(event.ctrlKey || event.ctrlKey && event.keyCode == 86){

		var input = obj;

		setTimeout(function(){
			var num = parseInt(input.value.split(',').join(''));
			input.value = isNaN(num)?'':number_format(num);
		},100);
		return true;
	}

	if(event.ctrlKey || event.ctrlKey && event.keyCode == 67){
		return true;
	}


	if((keyCode>=96 && keyCode<=105) || (keyCode>= 48&& keyCode <= 57)){	// 숫자
		return true;
	}

	if(keyCode == 190 || keyCode== 110){	// . 문자
		return true;
	}

	if($('#billType').val() == 2 && keyCode == 189){	
		return true;
	}

	if(keyCode == 189)
		return true;
	
	if((keyCode >= 73 && keyCode <= 79) || keyCode == 188 || keyCode == 85){
		return true;
	}
	if(keyCode == 109){
		return true;
	}
	try{
		sAlert('숫자만 입력가능합니다.');
	}catch(e){
		
	}
	
	return false;
}

function dateCheck(obj, keyCode, e) {

	var tmpDate = parseInt(obj.value);
	if (!isNaN(tmpDate)) {
		return false;
	}

	if (typeof (document.selection) != 'undefined') {
		document.selection.clear();
	}

	if (obj.value.length >= 8) {
		try {
			sAlert('총 8자리 숫자만 입력가능합니다.(년도:4, 월:2, 일:2)');
		}catch(e){}
		return false;
	}
	return true;
}


/*
// 원래 moneycheck 에서 사용하던건데 keydown 말고 keyup 이벤트로 대체 하면서 사용안해도 되게 되버렸음.
if((keyCode>=96 && keyCode<=105) || (keyCode>= 48&& keyCode <= 57)){
	var ch = parseInt(keyCode);
	ch -= (keyCode > 57) ? 96 : 48;
}else if(keyCode == 190 || keyCode == 110){
	var ch = '.';
}else{
	var ch = '';
}

if (document.selection.type == 'Text') {
	document.selection.clear(); // 블럭된 부분 삭제
}	
var cursorPosition = getCursorPosition(obj);
var oldValue = obj.value;
var beforeString = obj.value.substr(0, cursorPosition).split(',').join('');
var afterString = obj.value.substr(cursorPosition, obj.value.length-cursorPosition).split(',').join('');
var newValue = number_format(beforeString+String(ch)+afterString);

var range = obj.createTextRange();
var bookmark = range.getBookmark();
obj.value = newValue;
var newStart = beforeString.length+1;

for(var i=0; i < newStart && i < newValue.length; i++){
	if(newValue.charAt(i)==','){
		newStart++;
	}
}
selectRange(obj, newStart,newStart)
*/


/*
function number_format(str){
	str = new String(str).split(',').join('');
	var minusFlag = false;
	if(str.substr(0, 1) == '-'){
		minusFlag = true;
		str = str.substr(1, str.length-1);
	}
	var numStr = transNumStr(str);
	if(minusFlag){
		numStr = '-'+numStr;
	}
	return numStr;
}
function transNumStr(str){
	str = String(str);
	var length = str.length;
	if(length <=3){
		return str;
	}
	var numStr = '';
	for(var index = 0; index < length-1; index++){
		numStr += str.charAt(index);
		if((length-index-1)%3 == 0 ){
			numStr += ',';
		}
	}
	numStr += str.charAt(length-1);
	return numStr;
}
*/

/*
*	소숫점 인식 가능한 number_format
*/
