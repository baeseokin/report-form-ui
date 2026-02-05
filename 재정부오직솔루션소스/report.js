/**
 * 결산 및 보고서에서. 월단위 조회를 해야할 경우 사용.
 * 사용자가 선택한 조회 기간에 따라 조회 날짜를 설정해주는 lib

@author 김유리
@최종수정일 : 2014.7.11

*/

$(function(){
	
	insertAction();	// 날짜 입력칸에 숫자만 입력 가능하도록.
});



/**
 * 날짜 입력 input에 숫자만 입력 하도록 check 하는 메소드
 * 
 * @author 김유리
 * @최종수정일 : 2014.7.11
 * 
 */
function insertAction () // 키 이벤트를  부여
{	
	$(".inputDate").blur(function(){
		inputVal = this.value;
		for(i=0;i<inputVal.length;i++) {
			c = inputVal.charAt(i);
			if(c < '0' || c > '9'){
				alert("숫자만 입력하세요.");
				this.value="";
				this.focus();
				return false;
			}
		}
	});
}


/**
 * dateSet 날짜 관련 JS 함수와 날짜 변수를 묶어 객체로 변경 및 미흡한 부분 수정함
 * 
 * @author 김유리
 * @최종수정일 2014.07.11
 * 
 */
var DateSet = {
		
		startYear : 0,
		startMonth : 0,
		startDate : 0,
		endYear : 0,
		endMonth : 0,
		endDate : 0,
		
		sYear : 0,
		sMonth : 0,
		sDate : 0,
		
		monthDays : 0,
		newDay : new Date(),
		
		
		/** "오늘" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		ontoday : function(){
			
			this.newDay = new Date();
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = this.newDay.getDate();	
			
			this.endYear = this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();		
			this.endDate = this.newDay.getDate();	

			this.setStartEndDate();
		},

		/** "전날(<)" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		lastDay : function(){
			
			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth-1,this.sDate);
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = this.newDay.getDate()-1;
			
			this.endYear = this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();		
			this.endDate = this.newDay.getDate()-1;

			this.setStartEndDate();

			
		},
		
		
		/** "다음날(>)" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param 
		 * @param end_date
		 */
		nextDay : function() {

			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth-1,this.sDate);
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = this.newDay.getDate()+1;
			
			this.endYear = this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();		
			this.endDate = this.newDay.getDate()+1;

			this.setStartEndDate();
			
		},
		
		/** "이번달" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		thisMonth : function(){
			
			this.newDay = new Date();

			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = 1;
			
			
			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate = this.daysInMonth(this.endMonth,this.endYear);

			this.setStartEndDate();

			
		},
		
		/** "지난달" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		lastMonth : function(){
			
			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth-2,this.sDate);
			

			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = 1;
				
			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate = this.daysInMonth(this.endMonth,this.endYear);

			this.setStartEndDate();
			
		},
		
		
		/** "다음달" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		nextMonth : function(){
			
			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth,this.sDate);
			
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate = 1;
			
			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate = this.daysInMonth(this.endMonth,this.endYear);

			this.setStartEndDate();
			
		},
		
		/** "이번주" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		thisWeek : function(){
			
			this.newDay = new Date();
			var wNum = this.newDay.getDay();
			if(wNum === 0){
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()+1)-5);	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장
			}
			else{
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()-1));	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장		
			}
			
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate =  this.newDay.getDate();

			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate =  this.newDay.getDate() + 6;
			
			this.setStartEndDate();
			
		},
		
		/** "지난주" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		lastWeek : function(){
			
			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth-1,this.sDate);
			var wNum = this.newDay.getDay();
			if(wNum === 0){
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()+1)-5);	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장
			}
			else{
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()-1));	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장		
			}
			
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate =  this.newDay.getDate() - (this.newDay.getDay() + 1 )- 5

			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate =  this.startDate + 6;
			
			this.setStartEndDate();
			
		},
		
		/** "다음주" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		nextWeek : function(){
			
			this.getStartDate();
			this.newDay = new Date(this.sYear,this.sMonth-1,this.sDate);
			var wNum = this.newDay.getDay();
			if(wNum === 0){
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()+1)-5);	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장
			}
			else{
				this.newDay.setDate(this.newDay.getDate() - (this.newDay.getDay()-1));	//오늘날짜에서 오늘 요일값을(0~6) 빼준뒤 newDay에 저장		
			}
			
			this.startYear = this.newDay.getFullYear();	
			this.startMonth = this.newDay.getMonth();		
			this.startDate =  this.newDay.getDate() + 7 

			this.endYear =  this.newDay.getFullYear();	
			this.endMonth = this.newDay.getMonth();	
			this.endDate =  this.startDate + 6;
			
			this.setStartEndDate();
		},
		
		/** "이번년도" 버튼을 눌렀을때
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		thisYear : function(){
            var startDate = initDate.termStartDate.split('-');
            var endDate = initDate.termEndDate.split('-');

            this.startYear = startDate[0];
            this.startMonth = startDate[1]-1;
            this.startDate =  startDate[2];

            this.endYear =  endDate[0];
            this.endMonth = endDate[1]-1;
            this.endDate =  endDate[2];
			
			this.setStartEndDate();

		},
		
		/** "1~4분기" 버튼을 눌렀을때 
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		
		 thisDivergence : function(f){
            var startDate = initDate.termStartDate.split('-');
			
			this.newDay = new Date(parseInt(startDate[0]), parseInt(startDate[1])-4+3*f, 1);
			var eDay = new Date(this.newDay.getFullYear(), this.newDay.getMonth()+2, 1);

			
			this.startYear = parseInt(startDate[0]);
			this.startMonth = parseInt(startDate[1])-4+3*f;
			this.startDate =  1;

			this.endYear =  eDay.getFullYear();
			this.endMonth = eDay.getMonth();
			this.endDate =  this.daysInMonth(this.endMonth,this.endYear);
			
			this.setStartEndDate();
			
		 },
		 
		 /** "상반기,하반기" 버튼을 눌렀을때
		  * 
		  * @author 김유리
		  * @최종수정일 : 2014.7.11
		  * 
		  * @param start_date
		  * @param end_date
		  */
		 thisHalfTerm : function(f){

             var startDate = initDate.termStartDate.split('-');
             var endDate = initDate.termEndDate.split('-');

			if(f === 1){

                this.startYear = startDate[0];
                this.startMonth = startDate[1]-1;
                this.startDate =  startDate[2];

                this.endYear =  parseInt(startDate[0]);
                this.endMonth = parseInt(startDate[1]) +5 ;
                this.endDate =  startDate[2]-1;

			}else{

                this.startYear = parseInt(startDate[0]);
                this.startMonth = parseInt(startDate[1]) +5 ;
                this.startDate =  startDate[2];

                this.endYear =  endDate[0];
                this.endMonth = endDate[1]-1;
                this.endDate =  endDate[2];

            }


			this.setStartEndDate();

		 },
		
		
		/** 한달의 날짜가 며칠까지인지를 계산함
		 * 
		 * @author 김유리
		 * @최종수정일 : 2016.3.3
		 * 
		 * @param start_date
		 * @param end_date
		 */
		daysInMonth : function(mon,year){
            var lastDateOfMonth = new Date(year, mon+1, 0);
            return lastDateOfMonth.getDate();
		},
		
		setStartEndDate : function (){
			
			$( "#start_date" ).datepicker( "setDate", new Date(this.startYear,this.startMonth,this.startDate));
			$( "#end_date" ).datepicker( "setDate", new Date(this.endYear,this.endMonth,this.endDate));
		
			this.valSubmit();

		},
		
		/** input에 입력된 시작 날짜를 년.월.일로 분리해 저장한다.
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param 
		 * @param end_date
		 */
		
		getStartDate : function(){
			
			start_date = $('#start_date').val();
			
			this.sYear = start_date.substring(0,4);
			this.sMonth = start_date.substring(4,6);
			this.sDate = start_date.substring(6);
			
			
		},
		
		/** 조회 버튼을 누르면 start_date와 end_date를 가지고 searchForm submit
		 * 
		 * @author 김유리
		 * @최종수정일 : 2014.7.11
		 * 
		 * @param start_date
		 * @param end_date
		 */
		valSubmit : function(){	//값들을 검색 input box에 넣어서 submit 시켜줌	
			
			if(document.getElementById("searchForm").getAttribute("ttype") == "donation"){
				if(validate()){
					$("#searchForm").submit();	//submit시켜주기
				}
			}else if($("#searchForm").attr("worshipLedger")== 1 ){
				inquiry();
			}else if($("#searchForm").attr('ledger') === 'totalAcnt'){
				pqGridSet.getData();
			} else {
				if($("#searchForm").attr('bill')=='bill'||$("#searchForm").attr('bill')=='donation'){ //전표입력이면
					toQuery();
				}else{
					$("#searchForm").submit();	//submit시켜주기
				}
			}
		},
		
		NewchkDate : function (obj) {
			var nextAcntYear = parseInt(initDate.nAcntYear) + 1;
			
			var inputYear = obj.value.substr(0,4);
			var inputMon = obj.value.substr(4,2);
			var inputDate = obj.value.substr(6,2);
			var Days = this.daysInMonth(parseInt(inputMon)-1, parseInt(inputYear));

			var sD = new Date(parseInt(initDate.nAcntYear), parseInt(initDate.nAcntMonth), 1, 0, 0, 0, 1);
			var eD = new Date(parseInt(nextAcntYear), parseInt(initDate.nAcntMonth), 1, 0, 0, 0, 1);
			var thisDate = new Date(parseInt(inputYear), inputMon, parseInt(inputDate), 0, 0, 0, 1);

			if(this.chkNum(obj) == false) {
				obj.focus();
				return false;
			}

			if(parseInt(obj.value.length) > 0 && parseInt(obj.value.length) != 8) {
				alert("날짜 형식이 맞지 않습니다.");
				this.setToday(); 
				obj.focus();
				return false;  
			}
			if(1900 > inputYear || 2100  < inputYear) {
				alert("유효하지 않은 년도입니다.");
				this.setToday();
				obj.focus();
				return false;
			}  
			if(parseInt(inputMon) < 0 || parseInt(inputMon) > 12) {
				alert("월 형식이 맞지 않습니다.");
				this.setToday();
				obj.focus();
				return false;
			} 
			if(parseInt(inputDate) < 0 || parseInt(inputDate) > Days) {
				alert("일 형식이 맞지 않습니다...");
				this.setToday();
				obj.focus();
				return false;
			}

		},

		chkNum : function(obj) {
			var chkflag = true;
			for(var i = 0; i < obj.value.length; i++) {
				c = obj.value.charAt(i);
				if(!(c >= '0' && c <= '9')) {
					alert("숫자만 입력가능합니다");
					obj.value = "";
					chkflag = false;
					break;
				}
			}
			return chkflag;
		},
		
		setToday : function(){
			
			var startDate = $( "#start_date" ).datepicker('getDate');
			$( "#start_date" ).datepicker( "setDate", new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()));
			$( "#end_date" ).datepicker( "setDate", new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()));
		}
		
}

//printMode에서 사용하는 함수
function printMode(id){
	$("#printMode").val('1');
	window.open("","printPop","width=800,height=550,resizable=yes,scrollbars=auto");
	var target = $("#"+id).get(0).target;

	$("#"+id).get(0).target = "printPop";
	$("#"+id).submit();

	$("#"+id).get(0).target = target;
	$("#printMode").val('0');
}
