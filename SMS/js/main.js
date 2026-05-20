// Base URL for API
const API_URL = 'api/';

// App State
let state = {
    students: [],
    attendanceDate: new Date().toISOString().split('T')[0]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('attendanceDate').value = state.attendanceDate;
    
    // Setup event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('attendanceDate').addEventListener('change', handleDateChange);

    // Initial load
    fetchStats();
    fetchStudents();
});

// Navigation
function switchTab(tabId) {
    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id !== tabId) {
            content.classList.remove('active');
            setTimeout(() => {
                if (!content.classList.contains('active')) {
                    content.style.display = 'none';
                }
            }, 500); // Wait for transition
        }
    });

    const activeTab = document.getElementById(tabId);
    activeTab.style.display = 'block';
    // Small delay to ensure display:block applies before adding opacity transition
    setTimeout(() => activeTab.classList.add('active'), 50);

    // Refresh data based on tab
    if (tabId === 'dashboard') fetchStats();
    if (tabId === 'students') fetchStudents();
    if (tabId === 'attendance') fetchAttendance();
}

// API Calls
async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}get_stats.php`);
        const data = await res.json();
        
        // Animate numbers
        animateValue('stat-students', 0, data.total_students, 1000);
        animateValue('stat-courses', 0, data.total_courses, 1000);
        animateValue('stat-attendance', 0, data.attendance_percentage, 1000, '%');
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchStudents(search = '') {
    try {
        const res = await fetch(`${API_URL}students.php?search=${encodeURIComponent(search)}`);
        state.students = await res.json();
        renderStudentsTable();
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

async function fetchAttendance() {
    try {
        const res = await fetch(`${API_URL}attendance.php?date=${state.attendanceDate}`);
        const data = await res.json();
        renderAttendanceGrid(data);
    } catch (error) {
        console.error('Error fetching attendance:', error);
    }
}

async function saveStudent(e) {
    e.preventDefault();
    
    const id = document.getElementById('studentId').value;
    
    const studentData = {
        action: id ? 'update' : 'create',
        id: id,
        name: document.getElementById('s_name').value,
        roll_no: document.getElementById('s_roll').value,
        email: document.getElementById('s_email').value,
        course: document.getElementById('s_course').value,
        status: document.getElementById('s_status').value
    };

    try {
        const res = await fetch(`${API_URL}students.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        const result = await res.json();
        if (result.error) {
            showToast(result.error, true);
        } else {
            showToast(`Student successfully ${id ? 'updated' : 'added'}`);
            closeModal('addStudentModal');
            fetchStudents();
            fetchStats();
        }
    } catch (error) {
        showToast('Operation failed', true);
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this student from the matrix?')) return;
    
    try {
        const res = await fetch(`${API_URL}students.php`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        });
        const result = await res.json();
        
        if (result.error) {
            showToast(result.error, true);
        } else {
            showToast('Student removed successfully');
            fetchStudents();
            fetchStats();
        }
    } catch (error) {
        showToast('Operation failed', true);
    }
}

async function markAttendance(studentId, status) {
    try {
        const res = await fetch(`${API_URL}attendance.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, status: status })
        });
        
        const result = await res.json();
        if (!result.error) {
            // Update UI optimistically
            const card = document.getElementById(`att-card-${studentId}`);
            if (card) {
                card.classList.remove('border-green-500/50', 'border-red-500/50');
                card.classList.add(status === 'Present' ? 'border-green-500/50' : 'border-red-500/50');
                
                const statusBadge = card.querySelector('.att-status-text');
                if(statusBadge) {
                    statusBadge.textContent = status;
                    statusBadge.className = `att-status-text text-sm font-medium ${status === 'Present' ? 'text-green-400' : 'text-red-400'}`;
                }
            }
            showToast(`Marked ${status}`);
            fetchStats();
        }
    } catch (error) {
        showToast('Failed to mark attendance', true);
    }
}

// Rendering
function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    if (state.students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-500">No students found in the database.</td></tr>`;
        return;
    }

    state.students.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
        tr.style.animation = `fade-in-up 0.3s ease forwards ${index * 0.05}s`;
        tr.style.opacity = '0';
        
        const statusClass = student.status === 'Active' ? 'status-active' : 'status-inactive';
        
        tr.innerHTML = `
            <td class="py-4 px-6 text-gray-300 font-medium">#${student.roll_no}</td>
            <td class="py-4 px-6">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mr-3 text-sm font-bold text-gray-300 border border-white/10">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="text-white font-medium">${student.name}</div>
                        <div class="text-xs text-gray-500">${student.email}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6 text-gray-400">${student.course}</td>
            <td class="py-4 px-6">
                <span class="status-badge ${statusClass}">${student.status}</span>
            </td>
            <td class="py-4 px-6 text-right">
                <button onclick='editStudent(${JSON.stringify(student).replace(/'/g, "&#39;")})' class="text-blue-400 hover:text-blue-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteStudent(${student.id})" class="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAttendanceGrid(data) {
    const grid = document.getElementById('attendanceGrid');
    grid.innerHTML = '';
    
    if (data.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500">No active students to mark attendance for.</div>`;
        return;
    }

    data.forEach((student, index) => {
        let borderClass = 'border-glassBorder';
        let statusText = 'Not Marked';
        let statusColor = 'text-gray-500';
        
        if (student.status === 'Present') {
            borderClass = 'border-green-500/50';
            statusText = 'Present';
            statusColor = 'text-green-400';
        } else if (student.status === 'Absent') {
            borderClass = 'border-red-500/50';
            statusText = 'Absent';
            statusColor = 'text-red-400';
        }

        const div = document.createElement('div');
        div.className = `glass-card p-5 rounded-xl border ${borderClass} transition-colors duration-300 hover-float`;
        div.id = `att-card-${student.id}`;
        div.style.animation = `fade-in-up 0.3s ease forwards ${index * 0.05}s`;
        div.style.opacity = '0';
        
        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-white">${student.name}</h3>
                    <p class="text-sm text-gray-400">Roll: ${student.roll_no}</p>
                </div>
                <span class="att-status-text text-sm font-medium ${statusColor}">${statusText}</span>
            </div>
            <div class="flex gap-2 mt-4">
                <button onclick="markAttendance(${student.id}, 'Present')" class="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-lg transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-check mr-2"></i> Present
                </button>
                <button onclick="markAttendance(${student.id}, 'Absent')" class="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-lg transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-xmark mr-2"></i> Absent
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modalId === 'addStudentModal' && !document.getElementById('studentId').value) {
        document.getElementById('modalTitle').textContent = 'New Student Profile';
        document.getElementById('studentForm').reset();
    }
    modal.classList.remove('hidden');
    // small delay to allow display block to apply before opacity transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('opacity-0');
    modal.querySelector('.modal-content').classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('studentId').value = '';
        document.getElementById('studentForm').reset();
    }, 300);
}

function editStudent(student) {
    document.getElementById('studentId').value = student.id;
    document.getElementById('s_name').value = student.name;
    document.getElementById('s_roll').value = student.roll_no;
    document.getElementById('s_email').value = student.email;
    document.getElementById('s_course').value = student.course;
    document.getElementById('s_status').value = student.status;
    
    document.getElementById('modalTitle').textContent = 'Edit Matrix Profile';
    openModal('addStudentModal');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        setTimeout(() => {
            menu.classList.remove('opacity-0');
        }, 10);
    } else {
        menu.classList.add('opacity-0');
        setTimeout(() => {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        }, 300);
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    const icon = toast.querySelector('i');
    
    msg.textContent = message;
    
    if (isError) {
        toast.classList.replace('border-purple-500', 'border-red-500');
        icon.className = 'fa-solid fa-circle-exclamation text-red-400 mr-3';
    } else {
        toast.classList.replace('border-red-500', 'border-purple-500');
        icon.className = 'fa-solid fa-circle-check text-purple-400 mr-3';
    }
    
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function handleSearch(e) {
    fetchStudents(e.target.value);
}

function handleDateChange(e) {
    state.attendanceDate = e.target.value;
    fetchAttendance();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    // Parse values to handle floats vs ints
    let isFloat = !Number.isInteger(Number(end));
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        let current = start + easeProgress * (end - start);
        
        if (isFloat) {
            obj.innerHTML = current.toFixed(2) + suffix;
        } else {
            obj.innerHTML = Math.floor(current) + suffix;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

// Add CSS keyframes dynamically for fade-in
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
