// --- DOM 요소 가져오기 ---
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const weekDaysContainer = document.getElementById('week-days');
const currentMonthDisplay = document.getElementById('current-month-display');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');

// --- 상태 관리 변수 ---
// 1. 로컬스토리지 연동 (새로고침해도 데이터 유지)
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

// 2. 날짜 관리 변수 (기본값: 오늘)
let selectedDate = new Date(); 
let currentWeekStart = getStartOfWeek(new Date()); // 현재 보여지는 주의 월요일

// --- 유틸리티 함수 (날짜 관련) ---
// 날짜를 'YYYY-MM-DD' 문자열로 변환 (저장 및 비교용)
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 특정 날짜가 포함된 주의 월요일을 구하는 함수
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0(일) ~ 6(토)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6일, 아니면 월요일로 맞춤
    return new Date(d.setDate(diff));
}

// 특정 날짜에 등록된 투두 개수 구하기
function getTodoCount(dateString) {
    return todos.filter(todo => todo.date === dateString).length;
}

// 로컬스토리지에 데이터 저장
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// --- 화면 렌더링 함수 ---

// 1. 주간 달력 그리기
function renderCalendar() {
    weekDaysContainer.innerHTML = '';
    
    // 년/월 표시 업데이트
    currentMonthDisplay.textContent = `${currentWeekStart.getFullYear()}년 ${currentWeekStart.getMonth() + 1}월`;

    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    const todayString = formatDate(new Date());
    const selectedString = formatDate(selectedDate);

    // 월요일부터 일요일까지 7개의 카드를 생성
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        const dateString = formatDate(d);
        
        const card = document.createElement('div');
        card.className = 'day-card';
        if (dateString === todayString) card.classList.add('today');
        if (dateString === selectedString) card.classList.add('selected');

        const count = getTodoCount(dateString);

        card.innerHTML = `
            <span class="day-name">${dayNames[i]}</span>
            <span class="day-number">${d.getDate()}</span>
            <span class="todo-count">${count > 0 ? count + '개' : ''}</span>
        `;

        // 날짜 클릭 시 해당 날짜로 선택 변경
        card.addEventListener('click', () => {
            selectedDate = new Date(d);
            renderCalendar(); // 달력 다시 그리기 (선택 효과 업데이트)
            renderTodos();    // 해당 날짜의 투두 불러오기
        });

        weekDaysContainer.appendChild(card);
    }
}

// 2. 투두 리스트 그리기
function renderTodos() {
    todoList.innerHTML = '';
    const selectedString = formatDate(selectedDate);

    // 1차 필터링: 선택된 날짜의 투두만 걸러내기
    let filteredTodos = todos.filter(todo => todo.date === selectedString);

    // 2차 필터링: 전체/진행중/완료 탭 상태에 따라 걸러내기
    if (currentFilter === 'active') {
        filteredTodos = filteredTodos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = filteredTodos.filter(todo => todo.completed);
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        // 할 일 텍스트 (클릭 시 완료 토글)
        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;
        span.addEventListener('click', () => toggleComplete(todo.id));

        // 수정/삭제 버튼 그룹
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', () => editTodo(todo.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);
        
        li.appendChild(span);
        li.appendChild(btnGroup);
        todoList.appendChild(li);
    });
}

// --- CRUD 액션 함수 ---

function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('할 일을 입력해주세요!');
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        date: formatDate(selectedDate) // 선택된 날짜를 데이터에 포함!
    };

    todos.push(newTodo);
    todoInput.value = '';
    
    saveTodos();
    renderCalendar(); // 투두 개수가 변했으니 달력도 다시 그림
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderCalendar();
    renderTodos();
}

function toggleComplete(id) {
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

function editTodo(id) {
    const todoToEdit = todos.find(todo => todo.id === id);
    const newText = prompt('수정할 내용을 입력하세요:', todoToEdit.text);
    
    // 취소를 누르지 않았고 빈칸이 아닌 경우에만 업데이트
    if (newText !== null && newText.trim() !== '') {
        todoToEdit.text = newText.trim();
        saveTodos();
        renderTodos();
    }
}

// --- 이벤트 리스너 등록 ---

// 주차 이동 버튼
prevWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderCalendar();
});

nextWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderCalendar();
});

// 상태 필터 탭 클릭
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTodos();
    });
});

// 추가 버튼 및 엔터키
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// --- 앱 초기화 실행 ---
renderCalendar();
renderTodos();