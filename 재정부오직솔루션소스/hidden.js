// 이 파일은 본서버로 업로드 시키기 전 플래시 암호와 작업을 시행 해줄 파일입니다.
// checkbox 에 chkGroup 을 지정해 놓아야 해당 chkGroup 과 같은 그룹인 것들을 체크 할 수 있도록 함.


function all_chk_att(wCode,allChk){	// 이건 출석부에서만 사용가능 할 듯.

	$('.worshipCode').each(function(){
		if(this.disabled){
			return;
		}
		var WorshipCode=$(this).attr('WorshipCode');
		if(wCode==WorshipCode){
			this.checked = allChk.checked;
			this.parentNode.setAttribute('checked',allChk.checked);

			if(useAction){	// 출석부 처럼 체크 한 것에 대한 액션이 필요할 경우.
				_add(this);
			}
		}


	});

}

function all_chk(allobj,name){	//체크박스 전체선택 및 해제
	var obj=document.getElementsByName(name);
	for(i=0;i<obj.length;i++){
		if(obj[i].disabled){
			continue;
		}
		obj[i].checked = allobj.checked;
		obj[i].parentNode.setAttribute('checked',allobj.checked);
		if(useAction==true){	// 관리자권한에서 사용
			_add(obj[i]);
		}
	}
}


var Chk = {
	chkGroup : null,	// 현재 선택 중인 td
	chkOnOff : null,	// 클릭할 당시의 체크가 checked 였는지 아니였는지
	fromElement : null,	// 이전 항목. 0- 기타 1- td, 2- input 
	target : null,
	chkObj : null,	//  input object
	getEvent : function(event){
		try{
			this.target = event.srcElement;
		}catch(e){
			this.target = window.event.srcElement;
		}

		var obj = this.target;
		
		if(this.target==undefined){
			return false;
		}
		
		
		if(obj.tagName == 'TD'){
		
		
			this.chkObj = obj.getElementsByTagName('input')[0];
			if(this.chkObj){
				var chkGrp = this.chkObj.getAttribute('chkGroup');
			}
		}else if(obj.tagName == 'INPUT'){
		
		
			this.chkObj = obj;
			var chkGrp = obj.getAttribute('chkGroup');
		}
		return chkGrp;
	},
	startDrag : function(e){
		if(Chk.getEvent(e)){	// 정상 체크박스 일때. 셀렉트 안되게.

			return false;
		}
	},
	click : function(e){
		if(Chk.getEvent(e)){	// 정상 체크박스 일때. 체크박스 자체기능안되게.
			e.preventDefault();
			return false;
		}
	},
	getChecked : function(obj){
		var chkBox = $j(obj);

		var onoff = chkBox.parent().attr('checked')=='true'|| chkBox.parent().attr('checked')=='checked'|| chkBox.parent().attr('checked')==true || chkBox.attr('checked')=='true' || chkBox.attr('checked')==true || chkBox.attr('checked')=='checked' ? true : false;
		return onoff;
	},
	setChecked : function(obj,onoff){
		var chkBox = $j(obj);
		if(chkBox.attr('disabled')=='true' || chkBox.attr('disabled')==true){
			return;
		}

		obj.checked = onoff;
		obj.parentNode.setAttribute('checked',onoff);
		if(useAction){	// 출석부 처럼 체크 한 것에 대한 액션이 필요할 경우.
			_add(obj);
		}
			
	},
	down : function(e){
		var chkGrp;
		
		if(chkGrp = Chk.getEvent(e)){	// 정상 체크박스 일때.
			var onoff = Chk.getChecked(Chk.chkObj);
			
			Chk.chkGroup = chkGrp;
			Chk.chkOnOff = !onoff;
			Chk.fromElement = Chk.chkObj;
			Chk.setChecked(Chk.chkObj,!onoff);
		}else{
			Chk.chkGroup = null;
			Chk.chkOnOff = null;
			Chk.chkObj = null;
		}

	},
	up : function (e){
		
		Chk.chkGroup = null;
	},
	over : function (e){
		var chkGrp;
		
		if(chkGrp = Chk.getEvent(e)){	// 정상 체크박스 일때.
			
			if(Chk.chkGroup == chkGrp){	// 클릭누르기 전것과 같은경우에만.

				if(Chk.fromElement==Chk.chkObj){	// 같은 객체에서 움직이고 있을 때는 무효.
					return;
				}else{
					Chk.setChecked(Chk.chkObj,Chk.chkOnOff);
				}
			}
		}
	}

};

$j(document).mouseup(function(event){
	return Chk.up(event);
});

$j(document).mouseover(function(event){
	return Chk.over(event);
});

$j(document).mousedown(function(event){
	return Chk.down(event);
});

document.onselectstart = Chk.startDrag;
document.ondragstart = Chk.startDrag;

$j(document).click(function(event){
	return Chk.click(event);
});
