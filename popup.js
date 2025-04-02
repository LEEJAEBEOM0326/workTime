function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

function saveInputValues() {
    const values = {
        targetHours: document.getElementById('targetHours').value,
        targetMinutes: document.getElementById('targetMinutes').value,
        workedHours: document.getElementById('workedHours').value,
        workedMinutes: document.getElementById('workedMinutes').value,
        startTime: document.getElementById('startTime').value
    };
    setCookie('workingHoursCalc', JSON.stringify(values), 30);
}

function loadSavedValues() {
    const saved = getCookie('workingHoursCalc');
    if (saved) {
        const values = JSON.parse(saved);
        document.getElementById('targetHours').value = values.targetHours || '';
        document.getElementById('targetMinutes').value = values.targetMinutes || '';
        document.getElementById('workedHours').value = values.workedHours || '';
        document.getElementById('workedMinutes').value = values.workedMinutes || '';
        document.getElementById('startTime').value = values.startTime || '';
    }
}

function formatTime(hours) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (wholeHours === 0) {
        return `${minutes}분`;
    }
    return `${wholeHours}시간 ${minutes}분`;
}

function drawClock(canvas, workedPercentage, remainingPercentage, remainingTimeStr) {
    const ctx = canvas.getContext('2d');
    const radius = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
    ctx.save(); // 현재 상태 저장
    ctx.translate(radius, radius);

    // 배경 원 그리기
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();

    // 근무 시간 아크 그리기
    const workedEndAngle = (workedPercentage / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, workedEndAngle - Math.PI / 2);
    ctx.lineTo(0, 0);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();

    // 연한 초록색 배경 그리기 (빨간 아크와 겹치지 않도록)
    if (workedPercentage < 100) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, workedEndAngle - Math.PI / 2, 2 * Math.PI - Math.PI / 2);
        ctx.lineTo(0, 0);
        ctx.fillStyle = '#a3e4a5';
        ctx.fill();
    }

    // 연한 빨강색 배경 그리기
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, 2 * Math.PI);
    ctx.fillStyle = '#f2cfcf';
    ctx.fill();

    // 남은 시간 아크 그리기
    const remainingEndAngle = (remainingPercentage / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, -Math.PI / 2, remainingEndAngle - Math.PI / 2);
    ctx.lineTo(0, 0);
    ctx.fillStyle = '#f84b4b';
    ctx.fill();

    // 중앙 원 그리기
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore(); // 저장된 상태 복원
}

function calculateHours() {
    const targetHours = Number(document.getElementById('targetHours').value || 0);
    const targetMinutes = Number(document.getElementById('targetMinutes').value || 0);
    const workedHours = Number(document.getElementById('workedHours').value || 0);
    const workedMinutes = Number(document.getElementById('workedMinutes').value || 0);
    const startTime = document.getElementById('startTime').value;

    if (startTime === '') {
        alert('필수 필드를 입력해주세요.');
        return;
    }

    try {
        const targetTotal = targetHours + (targetMinutes / 60);
        const workedTotal = workedHours + (workedMinutes / 60);

        const now = new Date();
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);

        let todayHours = 0;
        if (now > startDateTime) {
            todayHours = (now - startDateTime) / (1000 * 60 * 60);
            if (now.getHours() >= 13) {
                todayHours = todayHours - 1;  // 점심시간 1시간 제외
            }
            todayHours = Math.max(0, todayHours);
        }

        const totalWorkedHours = workedTotal + todayHours;
        const remainingHours = targetTotal - totalWorkedHours;
        const requiredHoursToday = Math.min(remainingHours, 8);

        const endDateTime = new Date(startDateTime.getTime());
        endDateTime.setMilliseconds(0);
        endDateTime.setTime(endDateTime.getTime() + 9 * 60 * 60 * 1000);  // 출근 후 9시간 후 (점심시간 포함)

        const hours = endDateTime.getHours();
        const minutes = endDateTime.getMinutes();
        const period = hours >= 12 ? '오후' : '오전';
        const formattedHours = hours % 12 || 12;
        const endTimeStr = `${period} ${formattedHours}시 ${minutes}분`;

        const remainingTime = (endDateTime - now) / (1000 * 60 * 60);
        let remainingTimeStr;
        let remainingWorkPercentage;

        if (remainingTime < 0) {
            remainingTimeStr = '8시간 초과근무 중';
            remainingWorkPercentage = 100;
        } else {
            remainingTimeStr = formatTime(remainingTime);
            const totalWorkDayHours = 9; // 총 근무 시간 (9시간)
            const todayWorkedHours = totalWorkDayHours - remainingTime;
            remainingWorkPercentage = Math.round((todayWorkedHours / totalWorkDayHours) * 100);
        }

        const remainingLeavePercentage = Math.min(Math.round((totalWorkedHours / targetTotal) * 100), 100);

        const resultDiv = document.querySelector('.result');
        const resultWrap = document.getElementById('resultWrap');

        const totalWorkedHoursText = remainingLeavePercentage >= 100 ? '근무시간 초과' : `${formatTime(totalWorkedHours)}`;
        const remainingTimeText = remainingTime < 0 ? `하루 <strong>8시간 초과근무</strong> 중 입니다.` : `앞으로 <strong>${remainingTimeStr}</strong> 남았습니다.`;

        resultDiv.innerHTML = `
            <h3>근무시간 계산 결과</h3>
            <p class="highlight">총 근무시간: <em class="highlight-point">${totalWorkedHoursText}</em>  / ${targetHours}시간<span class="progress-bar" style="width: ${remainingLeavePercentage}%;"></span></p>
            <p class="highlight highlight-background">오늘 근무시간: <em class="highlight-point">${formatTime(todayHours)}</em> / 8시간 <span class="progress-bar" style="width: ${remainingWorkPercentage}%;"></span></p>
            <p class="result-txt">퇴근시간은 <strong>${endTimeStr}</strong>입니다. <br>
            ${remainingTimeText}</p>
        `;
        resultWrap.classList.add('active');

        saveInputValues();

        // 시계 모양으로 시각화
        const canvas = document.getElementById('workHoursClock');
        const workedPercentage = Math.round((totalWorkedHours / targetTotal) * 100);
        drawClock(canvas, workedPercentage, remainingWorkPercentage, remainingTimeStr);
    } catch (error) {
        alert('올바른 숫자를 입력해주세요.');
    }
}

document.addEventListener('DOMContentLoaded', loadSavedValues);
document.addEventListener('DOMContentLoaded', function() {
    loadSavedValues();
    document.getElementById('calculateButton').addEventListener('click', calculateHours);
});