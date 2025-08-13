// Global state management
let currentUser = null;
let currentPage = 'login';
let tasks = [];
let currentTaskId = null;
let currentEditingTaskId = null;
let sarahConversationHistory = [];
let pendingSarahAction = null;
let recognition = null;
let isListening = false;

// Sample data and users - Fixed to match demo credentials
const users = {
    'sarah.johnson@company.com': {
        id: 3,
        name: 'Sarah Johnson',
        role: 'Store Associate',
        department: 'Sales Floor',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'online'
    },
    'mike.chen@company.com': {
        id: 2,
        name: 'Mike Chen',
        role: 'Store Associate',
        department: 'Electronics',
        avatar: 'https://randomuser.me/api/portraits/men/29.jpg',
        status: 'online'
    },
    'emily.taylor@company.com': {
        id: 1,
        name: 'Emily Taylor',
        role: 'Store Manager',
        department: 'Customer Service',
        avatar: 'https://randomuser.me/api/portraits/women/21.jpg',
        status: 'online'
    }
};

// SARAH AI Natural Language Processing - Enhanced
const sarahNLP = {
    // Intent patterns for complex natural language understanding
    intents: {
        schedule: {
            patterns: ['schedule', 'shift', 'calendar', 'appointment', 'meeting', 'reschedule', 'time off'],
            responses: {
                show: 'Here\'s your current schedule: Today 9:00 AM - 5:00 PM shift. Tomorrow: Training session at 2:00 PM.',
                reschedule: 'I can help you reschedule. What would you like to change?',
                request: 'I\'ll submit your schedule request to your manager.'
            }
        },
        inventory: {
            patterns: ['inventory', 'stock', 'count', 'restock', 'items', 'products', 'supplies'],
            responses: {
                check: 'Current inventory status: 3 items low stock, 1 item out of stock. iPhone cases need urgent restocking.',
                update: 'I\'ve updated the inventory levels. Would you like me to create restock orders?',
                alert: 'Low stock alert: iPhone 15 Cases (5 units), Samsung Galaxy Cases (0 units).'
            }
        },
        tasks: {
            patterns: ['task', 'assignment', 'todo', 'work', 'complete', 'finish', 'delegate'],
            responses: {
                create: 'I\'ve created a new task and assigned it accordingly.',
                update: 'Task status updated successfully.',
                summary: 'You have 3 open tasks, 1 in progress, and 2 completed today.'
            }
        },
        communication: {
            patterns: ['chat', 'message', 'notify', 'tell', 'inform', 'send'],
            responses: {
                send: 'Message sent successfully to your team.',
                notify: 'I\'ve notified your supervisor about this request.',
                broadcast: 'Announcement sent to all staff members.'
            }
        },
        help: {
            patterns: ['help', 'support', 'assist', 'problem', 'issue', 'trouble'],
            responses: {
                general: 'I\'m here to help! I can assist with scheduling, inventory, tasks, communication, and more.',
                specific: 'I\'ve logged your request and notified the appropriate team member.',
                escalate: 'This has been escalated to your manager for immediate attention.'
            }
        },
        clock: {
            patterns: ['clock', 'time', 'punch', 'check in', 'check out', 'break'],
            responses: {
                in: 'You\'ve been successfully clocked in at',
                out: 'You\'ve been clocked out at',
                status: 'You clocked in at 9:00 AM today. Current time:'
            }
        }
    },

    // Advanced intent detection with context awareness
    detectIntent: function(message) {
        const lowerMessage = message.toLowerCase();
        let bestMatch = { intent: 'general', confidence: 0, action: 'help' };

        // Check for specific action words that indicate intent
        for (const [intentName, intentData] of Object.entries(this.intents)) {
            for (const pattern of intentData.patterns) {
                if (lowerMessage.includes(pattern)) {
                    const confidence = this.calculateConfidence(lowerMessage, pattern);
                    if (confidence > bestMatch.confidence) {
                        bestMatch = {
                            intent: intentName,
                            confidence: confidence,
                            action: this.determineAction(lowerMessage, intentName),
                            entities: this.extractEntities(lowerMessage)
                        };
                    }
                }
            }
        }

        return bestMatch;
    },

    // Calculate confidence based on pattern matching and context
    calculateConfidence: function(message, pattern) {
        const words = message.split(' ');
        const patternWords = pattern.split(' ');
        
        let matches = 0;
        for (const word of patternWords) {
            if (words.includes(word)) matches++;
        }
        
        return matches / Math.max(words.length, patternWords.length);
    },

    // Determine specific action based on context clues
    determineAction: function(message, intent) {
        const actionKeywords = {
            schedule: {
                'show': ['show', 'display', 'view', 'see', 'check'],
                'reschedule': ['reschedule', 'change', 'move', 'update'],
                'request': ['request', 'ask', 'need', 'want']
            },
            inventory: {
                'check': ['check', 'show', 'status', 'level'],
                'update': ['update', 'change', 'modify', 'set'],
                'alert': ['alert', 'low', 'warning', 'urgent']
            },
            tasks: {
                'create': ['create', 'add', 'new', 'make'],
                'update': ['complete', 'finish', 'done', 'update'],
                'summary': ['show', 'list', 'summary', 'all']
            },
            clock: {
                'in': ['in', 'start', 'begin'],
                'out': ['out', 'end', 'finish', 'stop'],
                'status': ['status', 'time', 'when']
            }
        };

        const intentActions = actionKeywords[intent];
        if (!intentActions) return 'general';

        for (const [action, keywords] of Object.entries(intentActions)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    return action;
                }
            }
        }

        return Object.keys(intentActions)[0]; // Default to first action
    },

    // Extract entities like dates, names, times, etc.
    extractEntities: function(message) {
        const entities = {
            date: null,
            time: null,
            person: null,
            item: null,
            priority: null
        };

        // Date patterns
        const datePatterns = [
            /\b(today|tomorrow|yesterday)\b/i,
            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/
        ];

        // Time patterns
        const timePatterns = [
            /\b(\d{1,2}:\d{2})\s*(am|pm)?\b/i,
            /\b(\d{1,2})\s*(am|pm)\b/i
        ];

        // Extract dates
        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) entities.date = match[0];
        }

        // Extract times
        for (const pattern of timePatterns) {
            const match = message.match(pattern);
            if (match) entities.time = match[0];
        }

        // Extract person names (simplified)
        const namePatterns = /\b(mike|sarah|emily|lisa|david|james|maria)\b/gi;
        const nameMatch = message.match(namePatterns);
        if (nameMatch) entities.person = nameMatch[0];

        // Extract priority
        if (/\b(urgent|high|important|asap)\b/i.test(message)) entities.priority = 'high';
        else if (/\b(low|later|when convenient)\b/i.test(message)) entities.priority = 'low';
        else entities.priority = 'medium';

        return entities;
    }
};

// ChatUI System Integration - Complete working chat system
window.ChatUI = (function () {
  // --- 50+ Dummy employee data ---
  const EMPLOYEES = [
    { id: 1, name: 'Emily Taylor', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', dept: 'Customer Service', role: 'Manager', status: 'online' },
    { id: 2, name: 'Mike Chen', avatar: 'https://randomuser.me/api/portraits/men/29.jpg', dept: 'Electronics', role: 'Associate', status: 'online' },
    { id: 3, name: 'Sarah Johnson', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', dept: 'Sales Floor', role: 'Associate', status: 'offline' },
    { id: 4, name: 'Jennifer Lopez', avatar: 'https://randomuser.me/api/portraits/women/65.jpg', dept: 'Inventory', role: 'Supervisor', status: 'away' },
    { id: 5, name: 'David Rodriguez', avatar: 'https://randomuser.me/api/portraits/men/52.jpg', dept: 'IT', role: 'Admin', status: 'online' },
    { id: 6, name: 'Lisa Wang', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', dept: 'Clothing', role: 'Associate', status: 'online' },
    { id: 7, name: 'James Wilson', avatar: 'https://randomuser.me/api/portraits/men/18.jpg', dept: 'Grocery', role: 'Associate', status: 'online' },
    { id: 8, name: 'Maria Garcia', avatar: 'https://randomuser.me/api/portraits/women/28.jpg', dept: 'Home & Garden', role: 'Associate', status: 'away' },
    { id: 9, name: 'Robert Brown', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', dept: 'Security', role: 'Officer', status: 'online' },
    { id: 10, name: 'Amanda Davis', avatar: 'https://randomuser.me/api/portraits/women/55.jpg', dept: 'Customer Service', role: 'Associate', status: 'online' },
    { id: 11, name: 'Kevin Martinez', avatar: 'https://randomuser.me/api/portraits/men/35.jpg', dept: 'Electronics', role: 'Specialist', status: 'online' },
    { id: 12, name: 'Jessica Miller', avatar: 'https://randomuser.me/api/portraits/women/42.jpg', dept: 'Clothing', role: 'Supervisor', status: 'away' },
    { id: 13, name: 'Daniel Anderson', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', dept: 'Grocery', role: 'Manager', status: 'online' },
    { id: 14, name: 'Sophie Taylor', avatar: 'https://randomuser.me/api/portraits/women/19.jpg', dept: 'Beauty', role: 'Associate', status: 'online' },
    { id: 15, name: 'Matthew Thomas', avatar: 'https://randomuser.me/api/portraits/men/38.jpg', dept: 'Sports', role: 'Associate', status: 'online' },
    { id: 16, name: 'Rachel White', avatar: 'https://randomuser.me/api/portraits/women/26.jpg', dept: 'Pharmacy', role: 'Technician', status: 'online' },
    { id: 17, name: 'Christopher Lee', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', dept: 'Auto Service', role: 'Mechanic', status: 'away' },
    { id: 18, name: 'Ashley Jackson', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', dept: 'Photo Center', role: 'Associate', status: 'online' },
    { id: 19, name: 'Joshua Harris', avatar: 'https://randomuser.me/api/portraits/men/27.jpg', dept: 'Maintenance', role: 'Technician', status: 'online' },
    { id: 20, name: 'Nicole Clark', avatar: 'https://randomuser.me/api/portraits/women/37.jpg', dept: 'Deli', role: 'Associate', status: 'online' }
  ];

  // map by id for fast lookup
  const EMPLOYEE_BY_ID = Object.fromEntries(EMPLOYEES.map(e => [e.id, e]));

  // --- Dummy initial conversations (pre-seeded) ---
  let conversations = [
    {
      id: 'c1',
      users: [3, 2], // Sarah & Mike
      messages: [
        { from: 3, text: 'Hi Mike, could you help with aisle 5 stock?', ts: '08:15' },
        { from: 2, text: 'On it! Will update soon.', ts: '08:16' },
      ],
      unread: { 2: 0, 3: 0 }
    },
    {
      id: 'c2',
      users: [3, 1], // Sarah & Emily
      messages: [
        { from: 1, text: 'Reminder: safety briefing at 10 AM.', ts: '07:30' },
        { from: 3, text: 'Thanks, on my way after check-in!', ts: '07:32' },
      ],
      unread: { 1: 0, 3: 1 },
    },
    {
      id: 'c3',
      users: [3, 5, 4], // Sarah, David, Jennifer (group)
      messages: [
        { from: 5, text: 'Tech check scheduled at noon.', ts: '07:01' },
        { from: 4, text: 'Inventory scanners fully charged.', ts: '07:02' },
        { from: 3, text: 'Thanks, team!', ts: '07:05' }
      ],
      unread: { 3: 0, 4: 1, 5: 2 }
    }
  ];

  let currentUserId = 3; // Default: Sarah logged in—will be updated by main app

  // --- Selectors and State ---
  const chatRoot = () => document.getElementById('chat-root');
  let open = false;
  let selectedConvId = null;

  // --- Cross-tab realtime ---
  const bc = new BroadcastChannel('employee_portal_chat');
  bc.onmessage = evt => {
    if (evt.data && evt.data.type === 'chat-message') {
      const { convId, msg } = evt.data;
      const conv = conversations.find(c => c.id === convId);
      if (conv) {
        conv.messages.push(msg);
        conv.unread = conv.unread || {};
        conv.users.forEach(uid => {
          if (uid !== msg.from) conv.unread[uid] = (conv.unread[uid] || 0) + 1;
        });
        render();
      }
    }
  };

  // --- Rendering Functions ---
  function render() {
    if (!open) {
      chatRoot().innerHTML = '';
      return;
    }
    chatRoot().innerHTML = `
      <div id="chat-panel">
        <div class="chat-sidebar">
          <div class="chat-header">
            <span>Chats</span>
            <button id="new-chat-btn" title="Start new chat">+</button>
          </div>
          <div class="chat-conv-list">
            ${conversations.map(c => {
              const otherUsers = c.users.filter(id => id !== currentUserId).map(uid => EMPLOYEE_BY_ID[uid]?.name).join(', ');
              const lastMsg = c.messages[c.messages.length-1];
              const unread = c.unread?.[currentUserId] || 0;
              return `
                <div class="chat-conv-item ${c.id===selectedConvId?'selected':''}" data-cid="${c.id}">
                  <img src="${EMPLOYEE_BY_ID[c.users.find(uid=>uid!==currentUserId)]?.avatar||''}" class="chat-conv-avatar"/>
                  <div class="chat-conv-main">
                    <div class="chat-conv-name">${otherUsers}</div>
                    <div class="chat-conv-preview">${lastMsg?.text||''}</div>
                  </div>
                  ${unread ? `<span class="chat-unread-badge">${unread}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="chat-main">
          ${selectedConvId ? renderConversation(selectedConvId) : `
            <div class="chat-placeholder">Select a conversation or start a new chat</div>
          `}
        </div>
      </div>
      <style>
        #chat-panel { display:flex; box-shadow:0 4px 12px rgba(0,0,0,.05); border-radius:8px; width:650px;height:420px; background:var(--color-surface);position:fixed;bottom:24px;right:24px;z-index:1000; }
        .chat-sidebar{width:200px;border-right:1px solid var(--color-border);display:flex;flex-direction:column;}
        .chat-header{padding:12px 8px 4px 8px;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:space-between;color:var(--color-text);}
        .chat-conv-list{flex:1;overflow:auto;}
        .chat-conv-item{display:flex;align-items:center;padding:8px;cursor:pointer; border-bottom:1px solid var(--color-border);}
        .chat-conv-item.selected{background:var(--color-bg-1);}
        .chat-conv-avatar{width:36px;height:36px;border-radius:50%;margin-right:8px;}
        .chat-conv-main{flex:1;}
        .chat-conv-name{font-weight:500;color:var(--color-text);}
        .chat-conv-preview{font-size:13px;color:var(--color-text-secondary);}
        .chat-unread-badge{background:var(--color-primary);color:var(--color-btn-primary-text);font-size:11px;padding:2px 7px;border-radius:12px;}
        .chat-main{flex:1;display:flex;flex-direction:column;}
        .chat-placeholder{margin:auto;color:var(--color-text-secondary);font-size:15px;text-align:center;}
        .chat-messages{flex:1;overflow:auto;padding:10px;}
        .chat-msg{display:flex;margin-bottom:8px;}
        .chat-msg.me{flex-direction:row-reverse;}
        .chat-msg-avatar{width:26px;height:26px;border-radius:50%;margin:0 9px;}
        .chat-msg-content{max-width:67%;background:var(--color-bg-2);border-radius:12px;padding:7px 12px;color:var(--color-text);}
        .chat-msg.me .chat-msg-content{background:var(--color-primary);color:var(--color-btn-primary-text);}
        .chat-msg-author{font-size:12px;font-weight:500;}
        .chat-msg-time{color:var(--color-text-secondary);font-size:10px;margin-left:6px;}
        .chat-input-bar{display:flex;border-top:1px solid var(--color-border);padding:8px 6px;}
        .chat-input-bar input{flex:1;padding:8px;border-radius:12px;border:1px solid var(--color-border);margin-right:6px;color:var(--color-text);background:var(--color-surface);}
        .chat-input-bar button{background:var(--color-primary);color:var(--color-btn-primary-text);border:none;padding:0 20px;border-radius:12px;cursor:pointer;}
        .chat-summary-btn{background:none;border:none;color:var(--color-primary);cursor:pointer;padding:8px 2px;font-size:13px;float:right;}
        #new-chat-btn{background:var(--color-primary);color:var(--color-btn-primary-text);border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
      </style>
    `;

    // UI Event Bindings
    document.querySelectorAll('.chat-conv-item').forEach(el => {
      el.onclick = () => {
        selectedConvId = el.getAttribute('data-cid');
        // Mark as read
        const conv = conversations.find(c => c.id === selectedConvId);
        if (conv && conv.unread) conv.unread[currentUserId] = 0;
        render();
      }
    });
    const inputField = document.getElementById('chat-msg-input');
    if (inputField) {
      inputField.onkeydown = ev => {
        if (ev.key === 'Enter') sendCurrentMsg();
      };
    }
    const sendBtn = document.getElementById('chat-msg-send');
    if (sendBtn) sendBtn.onclick = sendCurrentMsg;

    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
      newChatBtn.onclick = () => {
        // Build options for 'start chat'
        const already = conversations.flatMap(c=>c.users).filter(id=>id!==currentUserId);
        let s = '<div style="padding:15px;background:var(--color-surface);border-radius:8px;color:var(--color-text);"><h3>Start new chat</h3><ul style="list-style:none;padding:0;max-height:300px;overflow-y:auto;">';
        EMPLOYEES.forEach(emp=>{
          if (emp.id !== currentUserId && !already.includes(emp.id)) {
            s += `<li style="margin-bottom:7px;cursor:pointer;padding:8px;border-radius:4px;display:flex;align-items:center;" data-eid="${emp.id}" onmouseover="this.style.background='var(--color-bg-1)'" onmouseout="this.style.background='transparent'">
                <img src="${emp.avatar}" width="32" style="border-radius:16px;margin-right:8px"/>
                <div><div style="font-weight:500;">${emp.name}</div><div style="font-size:12px;color:var(--color-text-secondary);">${emp.dept}</div></div>
              </li>`;
          }
        });
        s += '</ul></div>';
        const modalBg = document.createElement('div');
        modalBg.id = 'chat-new-modal';
        modalBg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10000;';
        modalBg.innerHTML = s;
        document.body.appendChild(modalBg);
        
        modalBg.querySelectorAll('li[data-eid]').forEach(li=>{
          li.onclick = ()=>{
            let otherId = parseInt(li.getAttribute('data-eid'));
            let nc = {
              id: 'c'+(Date.now()),
              users: [currentUserId, otherId],
              messages: [],
              unread: { [currentUserId]: 0, [otherId]: 0 }
            };
            conversations.push(nc);
            selectedConvId = nc.id;
            modalBg.remove();
            render();
          };
        });
        modalBg.onclick = (ev)=>{
          if (ev.target.id === 'chat-new-modal') ev.target.remove();
        };
      };
    }

    // Summary button
    const summaryBtn = document.getElementById('chat-summary-btn');
    if (summaryBtn) {
      summaryBtn.onclick = () => {
        const sum = summarizeConversation(selectedConvId);
        alert(sum);
      };
    }
  }

  function renderConversation(cid) {
    const conv = conversations.find(c => c.id === cid);
    if (!conv) return '<div style="margin:2em;color:var(--color-text-secondary)">This chat is empty.</div>';
    let msgs = conv.messages.map(m => `
      <div class="chat-msg ${m.from===currentUserId?'me':''}">
        <img src="${EMPLOYEE_BY_ID[m.from]?.avatar||''}" class="chat-msg-avatar"/>
        <div class="chat-msg-content">
          <div class="chat-msg-author">
            ${EMPLOYEE_BY_ID[m.from]?.name||'User'} <span class="chat-msg-time">${m.ts}</span>
          </div>
          <div>${m.text}</div>
        </div>
      </div>`).join('');
    return `
      <div class="chat-messages">${msgs || '<div style="color:var(--color-text-secondary)">No messages yet.</div>'}</div>
      <div class="chat-input-bar">
        <input id="chat-msg-input" type="text" placeholder="Type a message..."/>
        <button id="chat-msg-send">Send</button>
        <button id="chat-summary-btn" class="chat-summary-btn" title="Summarize">Summary</button>
      </div>
    `;
  }

  function sendCurrentMsg() {
    const inp = document.getElementById('chat-msg-input');
    if (!inp || !selectedConvId || !inp.value.trim()) return;
    const msgText = inp.value.trim();
    const ts = new Date().toTimeString().slice(0,5);
    const msg = { from: currentUserId, text: msgText, ts };
    const conv = conversations.find(c=>c.id===selectedConvId);
    conv.messages.push(msg);
    conv.users.forEach(uid=>{
      if (uid !== currentUserId) conv.unread[uid]=(conv.unread[uid]||0)+1;
    });
    inp.value='';
    render();
    bc.postMessage({ type: 'chat-message', convId: selectedConvId, msg });
  }

  // **AI summarizer**
  function summarizeConversation(cid) {
    const conv = conversations.find(c=>c.id===cid);
    if (!conv) return "No conversation.";
    let summary = '';
    summary += `Chat between: ${conv.users.map(i=>EMPLOYEE_BY_ID[i].name).join(', ')}.\n\nTopics:\n`;
    let topics = {};
    conv.messages.forEach(m=>{
      let txt = m.text.toLowerCase();
      if (txt.includes('help')) topics['Help Request'] = true;
      if (txt.includes('reminder')) topics['Reminder'] = true;
      if (txt.includes('stock')) topics['Inventory'] = true;
      if (txt.includes('tech')) topics['Tech Support'] = true;
      if (txt.includes('safety')) topics['Safety'] = true;
    });
    summary += Object.keys(topics).map(t=>`- ${t}`).join('\n');
    if (!Object.keys(topics).length) summary += '- (General chat)';
    summary += `\n\nMessages: ${conv.messages.length}\n`;
    if (conv.messages.length) summary += `From ${conv.messages[0].ts} to ${conv.messages[conv.messages.length-1].ts}`;
    return summary;
  }

  // --- API ---
  function openChat() { 
    open = true; 
    if (!selectedConvId && conversations.length) selectedConvId = conversations[0].id; 
    render(); 
  }
  function closeChat() { 
    open = false; 
    render(); 
  }
  function toggle() { 
    open = !open; 
    if (open && !selectedConvId && conversations.length) selectedConvId = conversations[0].id; 
    render(); 
  }

  // --- Public methods for integration ---
  return {
    open: openChat,
    close: closeChat,
    toggle: toggle,
    setUserId: function(uid) { 
      currentUserId = uid; 
      selectedConvId = null; 
      // Update conversations based on current user
      render();
    },
    getEmployees: () => EMPLOYEES.slice(),
    init: () => {},
  };
})();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing app');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing application...');
    initializeTasks();
    setupEventListeners();
    showPage('login-page');
    // Initialize ChatUI
    ChatUI.init();
    // Initialize Speech Recognition for SARAH
    initializeSpeechRecognition();
    console.log('Application initialized successfully');
}

// Initialize Speech Recognition for SARAH
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            console.log('Voice recognition started');
            isListening = true;
            updateVoiceStatus(true);
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('Voice input received:', transcript);
            
            const sarahInput = document.getElementById('sarah-input');
            if (sarahInput) {
                sarahInput.value = transcript;
                setTimeout(() => sendSarahMessage(), 500);
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            updateVoiceStatus(false);
        };
        
        recognition.onend = function() {
            console.log('Voice recognition ended');
            isListening = false;
            updateVoiceStatus(false);
        };
        
        console.log('Speech recognition initialized');
    } else {
        console.log('Speech recognition not supported in this browser');
    }
}

function updateVoiceStatus(listening) {
    const voiceBtn = document.getElementById('voice-input-btn');
    const voiceStatus = document.getElementById('voice-status');
    
    if (voiceBtn) {
        if (listening) {
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '🎙️';
        } else {
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '🎤';
        }
    }
    
    if (voiceStatus) {
        if (listening) {
            voiceStatus.classList.remove('hidden');
        } else {
            voiceStatus.classList.add('hidden');
        }
    }
}

// Initialize tasks with sample data
function initializeTasks() {
    tasks = [
        {
            id: 1,
            title: 'Stock iPhone Cases',
            description: 'Restock iPhone 15 cases in Electronics section',
            priority: 'high',
            status: 'open',
            dueDate: '2025-08-06',
            assignee: 'Mike Chen',
            assigneeId: 2,
            createdDate: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Customer Service Training',
            description: 'Complete customer service excellence module',
            priority: 'medium',
            status: 'ongoing',
            dueDate: '2025-08-07',
            assignee: 'Sarah Johnson',
            assigneeId: 3,
            createdDate: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Inventory Count - Electronics',
            description: 'Complete full inventory count for Electronics department',
            priority: 'low',
            status: 'completed',
            dueDate: '2025-08-05',
            assignee: 'Mike Chen',
            assigneeId: 2,
            createdDate: new Date().toISOString()
        }
    ];
}

// Event listeners setup - FIXED LOGIN FUNCTIONALITY
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form - FIXED with immediate setup
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Login form found, setting up event listener');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found!');
    }

    // Logout buttons
    setTimeout(() => {
        const logoutBtns = document.querySelectorAll('#store-logout, #corporate-logout');
        logoutBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', handleLogout);
            }
        });
    }, 100);

    // Navigation tabs
    setTimeout(() => {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                switchTab(tabName);
            });
        });
    }, 100);

    // Profile dropdown toggles
    setupDropdownToggle('profile-btn', 'profile-dropdown');
    setupDropdownToggle('corporate-profile-btn', 'corporate-profile-dropdown');
    setupDropdownToggle('notification-btn', 'notification-dropdown');

    // Chat functionality
    setupChatEventListeners();

    // Quick Actions Drawer
    setupQuickActionsDrawer();

    // Modal functionality
    setupModalEventListeners();

    // Task management
    setupTaskEventListeners();

    // Training hub
    setupTrainingEventListeners();

    // SARAH AI Assistant - Enhanced
    setupSarahEventListeners();

    // Analytics charts initialization
    setTimeout(initializeCharts, 1000);

    // Inventory management
    setupInventoryEventListeners();

    // Store map and planogram
    setupStoreMapEventListeners();

    console.log('Event listeners setup complete');
}

// Quick Actions Drawer
function setupQuickActionsDrawer() {
    console.log('Setting up Quick Actions Drawer...');
    
    setTimeout(() => {
        const quickActionsToggle = document.getElementById('quick-actions-toggle');
        const drawer = document.getElementById('quick-actions-drawer');
        const closeDrawer = document.getElementById('close-drawer');

        if (quickActionsToggle && drawer) {
            console.log('Quick Actions components found, setting up...');
            
            quickActionsToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Quick Actions button clicked');
                drawer.classList.remove('hidden');
            });

            if (closeDrawer) {
                closeDrawer.addEventListener('click', () => {
                    console.log('Close drawer clicked');
                    drawer.classList.add('hidden');
                });
            }

            // Setup drawer action buttons
            const drawerActions = {
                'qa-clock-in-out': 'clock-in-out-modal',
                'qa-report-issue': 'report-issue-modal',
                'qa-request-assistance': 'request-assistance-modal',
                'qa-price-check': 'price-check-modal',
                'qa-absence-request': 'absence-request-modal',
                'qa-training-hub': () => {
                    drawer.classList.add('hidden');
                    switchTab('training');
                }
            };

            Object.entries(drawerActions).forEach(([buttonId, action]) => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.addEventListener('click', () => {
                        console.log(`Quick Action ${buttonId} clicked`);
                        drawer.classList.add('hidden');
                        if (typeof action === 'string') {
                            openModal(action);
                        } else {
                            action();
                        }
                    });
                }
            });

            // Close drawer on outside click
            drawer.addEventListener('click', (e) => {
                if (e.target === drawer) {
                    drawer.classList.add('hidden');
                }
            });
            
            console.log('Quick Actions Drawer setup complete');
        } else {
            console.error('Quick Actions components not found');
        }
    }, 200);
}

// Task Management - Enhanced
function setupTaskEventListeners() {
    console.log('Setting up Task Management...');
    
    setTimeout(() => {
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskSettingsBtn = document.getElementById('task-settings-btn');
        const taskForm = document.getElementById('task-form');
        const cancelTaskEditor = document.getElementById('cancel-task-editor');
        const saveTaskSettings = document.getElementById('save-task-settings');

        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                console.log('Add Task button clicked');
                currentEditingTaskId = null;
                const modalTitle = document.getElementById('task-modal-title');
                if (modalTitle) modalTitle.textContent = 'Add New Task';
                populateTaskAssigneeDropdown();
                clearTaskForm();
                openModal('task-editor-modal');
            });
        }

        if (taskSettingsBtn) {
            taskSettingsBtn.addEventListener('click', () => {
                console.log('Task Settings button clicked');
                openModal('task-settings-modal');
            });
        }

        if (taskForm) {
            taskForm.addEventListener('submit', handleTaskFormSubmit);
        }

        if (cancelTaskEditor) {
            cancelTaskEditor.addEventListener('click', () => {
                closeModal('task-editor-modal');
            });
        }

        if (saveTaskSettings) {
            saveTaskSettings.addEventListener('click', () => {
                console.log('Task settings saved');
                closeModal('task-settings-modal');
            });
        }

        // Status change modal
        setupTaskStatusModal();
        
        console.log('Task Management setup complete');
    }, 200);
}

function setupTaskStatusModal() {
    setTimeout(() => {
        const statusButtons = document.querySelectorAll('.status-option-btn');
        statusButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newStatus = btn.dataset.status;
                console.log(`Status change to: ${newStatus}`);
                if (currentTaskId) {
                    updateTaskStatus(currentTaskId, newStatus);
                    closeModal('task-status-modal');
                }
            });
        });
    }, 200);
}

function populateTaskAssigneeDropdown() {
    const assigneeSelect = document.getElementById('task-assignee');
    if (!assigneeSelect) return;

    const employees = ChatUI.getEmployees();
    assigneeSelect.innerHTML = '<option value="">Select Assignee</option>';
    
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.dept})`;
        assigneeSelect.appendChild(option);
    });
}

function clearTaskForm() {
    const titleField = document.getElementById('task-title');
    const descField = document.getElementById('task-description');
    const priorityField = document.getElementById('task-priority');
    const dateField = document.getElementById('task-due-date');
    const assigneeField = document.getElementById('task-assignee');
    
    if (titleField) titleField.value = '';
    if (descField) descField.value = '';
    if (priorityField) priorityField.value = 'medium';
    if (dateField) dateField.value = '';
    if (assigneeField) assigneeField.value = '';
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    console.log('Task form submitted');
    
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const assigneeId = parseInt(document.getElementById('task-assignee').value);
    
    if (!title || !dueDate || !assigneeId) {
        alert('Please fill in all required fields');
        return;
    }

    const employees = ChatUI.getEmployees();
    const assignee = employees.find(emp => emp.id === assigneeId);
    
    const taskData = {
        title,
        description,
        priority,
        dueDate,
        assignee: assignee.name,
        assigneeId,
        status: 'open',
        createdDate: new Date().toISOString()
    };

    if (currentEditingTaskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === currentEditingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            console.log('Task updated:', tasks[taskIndex]);
        }
    } else {
        // Add new task
        const newTask = {
            id: Date.now(),
            ...taskData
        };
        tasks.push(newTask);
        console.log('New task added:', newTask);
    }

    loadTasks();
    closeModal('task-editor-modal');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    console.log('Editing task:', taskId);
    currentEditingTaskId = taskId;
    
    const modalTitle = document.getElementById('task-modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Task';
    
    // Populate form with task data
    const titleField = document.getElementById('task-title');
    const descField = document.getElementById('task-description');
    const priorityField = document.getElementById('task-priority');
    const dateField = document.getElementById('task-due-date');
    
    if (titleField) titleField.value = task.title;
    if (descField) descField.value = task.description;
    if (priorityField) priorityField.value = task.priority;
    if (dateField) dateField.value = task.dueDate;
    
    populateTaskAssigneeDropdown();
    
    const assigneeField = document.getElementById('task-assignee');
    if (assigneeField) assigneeField.value = task.assigneeId;
    
    openModal('task-editor-modal');
}

function changeTaskStatus(taskId) {
    console.log('Changing status for task:', taskId);
    currentTaskId = taskId;
    openModal('task-status-modal');
}

function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        console.log(`Task ${taskId} status updated to: ${newStatus}`);
        loadTasks();
    }
}

function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    const shiftTime = document.getElementById('store-shift-time');
    
    if (shiftTime) {
        const currentHour = new Date().getHours();
        if (currentHour >= 6 && currentHour < 14) {
            shiftTime.textContent = 'Morning Shift';
        } else if (currentHour >= 14 && currentHour < 22) {
            shiftTime.textContent = 'Evening Shift';
        } else {
            shiftTime.textContent = 'Night Shift';
        }
    }
    
    if (!tasksList) return;
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item status-${task.status}" data-task-id="${task.id}">
            <div class="task-info">
                <div class="task-name">${task.title}</div>
                <div class="task-time">Due: ${formatDate(task.dueDate)} | Assigned to: ${task.assignee}</div>
                ${task.description ? `<div class="task-time">${task.description}</div>` : ''}
            </div>
            <div class="task-actions">
                <span class="task-status status status--${getStatusClass(task.status)}">${task.status}</span>
                <button class="task-action-btn" onclick="editTask(${task.id})" title="Edit Task">✏️</button>
                <button class="task-action-btn" onclick="changeTaskStatus(${task.id})" title="Change Status">⚙️</button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function getStatusClass(status) {
    const statusMap = {
        'open': 'info',
        'ongoing': 'warning',
        'completed': 'success',
        'delayed': 'error',
        'de-prioritised': 'info',
        'delegated': 'warning'
    };
    return statusMap[status] || 'info';
}

// Chat functionality - Updated to use ChatUI system
function setupChatEventListeners() {
    console.log('Setting up ChatUI integration...');
    
    // Chat toggle buttons for both dashboards
    const setupChatButton = (buttonId) => {
        setTimeout(() => {
            const toggleChatBtn = document.getElementById(buttonId);
            if (toggleChatBtn) {
                toggleChatBtn.replaceWith(toggleChatBtn.cloneNode(true));
                const newToggleChatBtn = document.getElementById(buttonId);
                
                newToggleChatBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('ChatUI toggle button clicked!');
                    ChatUI.toggle();
                });
                
                console.log(`ChatUI button ${buttonId} integrated successfully`);
            }
        }, 500);
    };

    // Setup chat buttons for both dashboards
    setupChatButton('toggle-chat');
    setupChatButton('toggle-chat-corp');
}

// Authentication - FIXED
function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted - event handler called');
    
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');
    
    if (!emailField || !passwordField || !errorDiv) {
        console.error('Login form fields not found');
        return;
    }
    
    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    
    console.log('Login attempt:', email, '(password provided:', password ? 'yes' : 'no', ')');
    
    // Clear previous errors
    errorDiv.classList.add('hidden');
    
    // Validate credentials
    if (users[email]) {
        const validPasswords = ['store123', 'manager123'];
        if (validPasswords.includes(password)) {
            currentUser = users[email];
            console.log('User logged in successfully:', currentUser);
            
            // Update ChatUI with current user ID
            ChatUI.setUserId(currentUser.id);
            
            if (currentUser.role === 'Store Manager') {
                showPage('corporate-dashboard');
                setupCorporateProfile();
            } else {
                showPage('store-dashboard');
                setupStoreProfile();
            }
            
            return;
        }
    }
    
    // Show error for invalid credentials
    errorDiv.textContent = 'Invalid credentials. Please use the demo credentials provided below.';
    errorDiv.classList.remove('hidden');
    console.log('Login failed for:', email);
}

function handleLogout() {
    console.log('User logging out');
    currentUser = null;
    ChatUI.close();
    closeModal('sarah-modal');
    showPage('login-page');
}

function setupStoreProfile() {
    if (!currentUser) return;
    
    console.log('Setting up store profile for:', currentUser.name);
    
    const profileImg = document.getElementById('profile-img');
    const profileName = document.getElementById('profile-name');
    const profileRole = document.getElementById('profile-role');
    const greeting = document.getElementById('personal-greeting');
    
    if (profileImg) profileImg.src = currentUser.avatar;
    if (profileName) profileName.textContent = currentUser.name;
    if (profileRole) profileRole.textContent = currentUser.role;
    if (greeting) greeting.textContent = `Hey ${currentUser.name.split(' ')[0]}!`;
    
    // Initialize store-specific features
    loadTasks();
    loadStaffOnDuty();
    loadNotifications();
    loadInventoryData();
    loadTrainingModules();
}

function setupCorporateProfile() {
    if (!currentUser) return;
    
    console.log('Setting up corporate profile for:', currentUser.name);
    
    const profileImg = document.getElementById('corporate-profile-img');
    const profileName = document.getElementById('corporate-profile-name');
    const profileRole = document.getElementById('corporate-profile-role');
    const greeting = document.getElementById('corporate-personal-greeting');
    
    if (profileImg) profileImg.src = currentUser.avatar;
    if (profileName) profileName.textContent = currentUser.name;
    if (profileRole) profileRole.textContent = currentUser.role;
    if (greeting) greeting.textContent = `Hey ${currentUser.name.split(' ')[0]}!`;
}

// Page management
function showPage(pageId) {
    console.log('Switching to page:', pageId);
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.classList.remove('hidden');
    }
    
    currentPage = pageId;
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.classList.remove('hidden');
    }
}

// Dropdown functionality
function setupDropdownToggle(buttonId, dropdownId) {
    setTimeout(() => {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);
        
        if (button && dropdown) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other dropdowns
                document.querySelectorAll('.profile-dropdown, .notification-dropdown').forEach(dd => {
                    if (dd.id !== dropdownId) {
                        dd.classList.add('hidden');
                    }
                });
                
                dropdown.classList.toggle('hidden');
            });
            
            // Close on outside click
            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });
            
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }, 200);
}

// Staff Management
function loadStaffOnDuty() {
    const staffList = document.getElementById('staff-on-duty');
    if (!staffList) return;
    
    const staffMembers = [
        { name: 'Mike Chen', role: 'Associate', avatar: users['mike.chen@company.com'].avatar },
        { name: 'Emily Taylor', role: 'Manager', avatar: users['emily.taylor@company.com'].avatar },
        { name: 'David Park', role: 'Associate', avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM1RDg3OEYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RFA8L3RleHQ+PC9zdmc+' }
    ];
    
    staffList.innerHTML = staffMembers.map(member => `
        <div class="staff-item">
            <img src="${member.avatar}" alt="${member.name}" class="staff-avatar">
            <div class="staff-info">
                <div class="staff-name">${member.name}</div>
                <div class="staff-role">${member.role}</div>
            </div>
            <div class="staff-status"></div>
        </div>
    `).join('');
}

// Notifications
function loadNotifications() {
    const notificationGroups = document.getElementById('notification-groups');
    const notificationBadge = document.getElementById('notification-badge');
    
    if (!notificationGroups) return;
    
    const notifications = [
        {
            group: 'Tasks & Assignments',
            items: [
                {
                    title: 'New Task Assigned',
                    message: 'Inventory count scheduled for Electronics section',
                    time: '5 minutes ago',
                    unread: true
                },
                {
                    title: 'Task Completed',
                    message: 'Customer service training module finished',
                    time: '1 hour ago',
                    unread: false
                }
            ]
        },
        {
            group: 'Company News',
            items: [
                {
                    title: 'Store Performance Update',
                    message: 'Great job team! We exceeded our monthly targets',
                    time: '2 hours ago',
                    unread: true
                }
            ]
        }
    ];
    
    let totalUnread = 0;
    
    notificationGroups.innerHTML = notifications.map(group => {
        const unreadCount = group.items.filter(item => item.unread).length;
        totalUnread += unreadCount;
        
        return `
            <div class="notification-group">
                <div class="notification-group-header">
                    ${group.group}
                    ${unreadCount > 0 ? `<span class="notification-badge">${unreadCount}</span>` : ''}
                </div>
                ${group.items.map(item => `
                    <div class="notification-item ${item.unread ? 'unread' : ''}">
                        <div class="notification-title">${item.title}</div>
                        <div class="notification-message">${item.message}</div>
                        <div class="notification-time">${item.time}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
    
    if (notificationBadge) {
        if (totalUnread > 0) {
            notificationBadge.textContent = totalUnread;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
}

// Modal Management
function setupModalEventListeners() {
    console.log('Setting up modal event listeners...');
    
    setTimeout(() => {
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
        
        // Close on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Setup Quick Action modal forms
        setupQuickActionModals();
        
        console.log('Modal event listeners setup complete');
    }, 200);
}

function setupQuickActionModals() {
    console.log('Setting up Quick Action modals...');
    
    // Clock In/Out Modal
    setupClockInOutModal();
    
    // Report Issue Form
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportIssue);
    }

    // Request Assistance Form
    const assistanceForm = document.getElementById('assistance-form');
    if (assistanceForm) {
        assistanceForm.addEventListener('submit', handleRequestAssistance);
    }

    // Price Check Form
    const priceForm = document.getElementById('price-form');
    if (priceForm) {
        priceForm.addEventListener('submit', handlePriceCheck);
    }

    // Absence Request Form
    const absenceForm = document.getElementById('absence-form');
    if (absenceForm) {
        absenceForm.addEventListener('submit', handleAbsenceRequest);
    }
}

function setupClockInOutModal() {
    setTimeout(() => {
        const clockInBtn = document.getElementById('clock-in-btn');
        const clockOutBtn = document.getElementById('clock-out-btn');
        const currentTimeSpan = document.getElementById('current-time');

        if (currentTimeSpan) {
            // Update current time immediately and then every second
            const updateTime = () => {
                const now = new Date();
                currentTimeSpan.textContent = now.toLocaleTimeString();
            };
            updateTime();
            setInterval(updateTime, 1000);
        }

        if (clockInBtn) {
            clockInBtn.addEventListener('click', () => {
                const now = new Date();
                console.log('Clock In:', now.toLocaleString());
                alert(`Clocked IN at ${now.toLocaleTimeString()}`);
                closeModal('clock-in-out-modal');
            });
        }

        if (clockOutBtn) {
            clockOutBtn.addEventListener('click', () => {
                const now = new Date();
                console.log('Clock Out:', now.toLocaleString());
                alert(`Clocked OUT at ${now.toLocaleTimeString()}`);
                closeModal('clock-in-out-modal');
            });
        }
    }, 200);
}

function handleReportIssue(e) {
    e.preventDefault();
    const category = document.getElementById('issue-category').value;
    const description = document.getElementById('issue-description').value;
    
    console.log('Issue reported:', { category, description });
    alert(`Issue reported: ${category}\nDescription: ${description}`);
    closeModal('report-issue-modal');
    e.target.reset();
}

function handleRequestAssistance(e) {
    e.preventDefault();
    const urgency = document.getElementById('assistance-urgency').value;
    const reason = document.getElementById('assistance-reason').value;
    
    console.log('Assistance requested:', { urgency, reason });
    alert(`Assistance requested (${urgency}):\n${reason}`);
    closeModal('request-assistance-modal');
    e.target.reset();
}

function handlePriceCheck(e) {
    e.preventDefault();
    const sku = document.getElementById('price-sku').value;
    
    // Simulate price check result
    const mockResults = {
        '12345': { name: 'iPhone 15 Case', price: '$29.99', stock: '15 units' },
        '67890': { name: 'Samsung Galaxy Case', price: '$24.99', stock: '0 units' },
        'default': { name: 'Bluetooth Headphones', price: '$79.99', stock: '23 units' }
    };
    
    const result = mockResults[sku] || mockResults.default;
    
    document.getElementById('product-name').textContent = result.name;
    document.getElementById('current-price').textContent = result.price;
    document.getElementById('stock-level').textContent = result.stock;
    document.getElementById('price-result').classList.remove('hidden');
    
    console.log('Price check for SKU:', sku, result);
}

function handleAbsenceRequest(e) {
    e.preventDefault();
    const type = document.getElementById('absence-type').value;
    const startDate = document.getElementById('absence-start').value;
    const endDate = document.getElementById('absence-end').value;
    const reason = document.getElementById('absence-reason').value;
    
    console.log('Absence request:', { type, startDate, endDate, reason });
    alert(`Absence request submitted:\nType: ${type}\nDates: ${startDate} to ${endDate}`);
    closeModal('absence-request-modal');
    e.target.reset();
}

function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modalId) {
    console.log('Closing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Training Hub
function setupTrainingEventListeners() {
    const trainingHubBtn = document.getElementById('training-hub-btn');
    if (trainingHubBtn) {
        trainingHubBtn.addEventListener('click', () => {
            switchTab('training');
        });
    }
}

function loadTrainingModules() {
    const trainingModules = document.getElementById('training-modules');
    if (!trainingModules) return;
    
    const modules = [
        {
            id: 1,
            title: 'Customer Service Excellence',
            description: 'Learn advanced customer service techniques',
            duration: '45 minutes',
            progress: 100,
            status: 'completed',
            icon: '🎯'
        },
        {
            id: 2,
            title: 'Product Knowledge: Electronics',
            description: 'Deep dive into our electronics inventory',
            duration: '60 minutes',
            progress: 65,
            status: 'in-progress',
            icon: '📱'
        },
        {
            id: 3,
            title: 'Safety Protocols',
            description: 'Essential safety procedures and guidelines',
            duration: '30 minutes',
            progress: 0,
            status: 'available',
            icon: '🛡️'
        }
    ];
    
    trainingModules.innerHTML = modules.map(module => `
        <div class="training-module ${module.status}" data-module-id="${module.id}">
            <div class="module-header">
                <div class="module-icon">${module.icon}</div>
                <span class="module-status ${module.status}">${module.status.replace('-', ' ')}</span>
            </div>
            <div class="module-title">${module.title}</div>
            <div class="module-description">${module.description}</div>
            <div class="module-meta">
                <span>Duration: ${module.duration}</span>
                ${module.status === 'completed' ? '<span class="certificate-badge">🏆 Certificate</span>' : ''}
            </div>
            ${module.progress > 0 ? `
                <div class="module-progress">
                    <div class="module-progress-bar">
                        <div class="module-progress-fill" style="width: ${module.progress}%"></div>
                    </div>
                    <span>${module.progress}% Complete</span>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.training-module').forEach(module => {
        module.addEventListener('click', () => {
            const moduleId = module.dataset.moduleId;
            openTrainingModule(moduleId);
        });
    });
}

function openTrainingModule(moduleId) {
    const trainingPlayer = document.getElementById('current-training');
    if (trainingPlayer) {
        trainingPlayer.classList.remove('hidden');
    }
}

// SARAH AI Assistant - Enhanced with advanced capabilities
function setupSarahEventListeners() {
    console.log('Setting up SARAH AI Assistant...');
    
    setTimeout(() => {
        const sarahButton = document.getElementById('sarah-button');
        const sarahModal = document.getElementById('sarah-modal');
        const closeSarah = document.getElementById('close-sarah-modal');
        const sendSarah = document.getElementById('send-sarah');
        const sarahInput = document.getElementById('sarah-input');
        const voiceInputBtn = document.getElementById('voice-input-btn');
        
        if (sarahButton) {
            sarahButton.addEventListener('click', () => {
                openModal('sarah-modal');
                initializeSarahInterface();
            });
        }
        
        if (sendSarah) {
            sendSarah.addEventListener('click', sendSarahMessage);
        }
        
        if (sarahInput) {
            sarahInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendSarahMessage();
                }
            });
        }
        
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', toggleVoiceInput);
        }
        
        // Setup prompt buttons
        setupSarahPromptButtons();
        
        // Setup confirmation modal
        setupSarahConfirmationModal();
        
        console.log('SARAH AI Assistant setup complete');
    }, 300);
}

function initializeSarahInterface() {
    // Set current time for initial message
    const initialTimeSpan = document.getElementById('initial-time');
    if (initialTimeSpan) {
        initialTimeSpan.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Clear any previous conversation state
    sarahConversationHistory = [];
    
    console.log('SARAH interface initialized');
}

function setupSarahPromptButtons() {
    setTimeout(() => {
        const promptButtons = document.querySelectorAll('.prompt-btn');
        promptButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                useSarahPrompt(prompt);
            });
        });
    }, 100);
}

function setupSarahConfirmationModal() {
    setTimeout(() => {
        const confirmExecute = document.getElementById('confirm-execute');
        const confirmCancel = document.getElementById('confirm-cancel');
        const closeSarahConfirm = document.getElementById('close-sarah-confirm');
        
        if (confirmExecute) {
            confirmExecute.addEventListener('click', executePendingSarahAction);
        }
        
        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                closeModal('sarah-confirm-modal');
                pendingSarahAction = null;
            });
        }
        
        if (closeSarahConfirm) {
            closeSarahConfirm.addEventListener('click', () => {
                closeModal('sarah-confirm-modal');
                pendingSarahAction = null;
            });
        }
    }, 100);
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('Voice recognition is not supported in this browser.');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function useSarahPrompt(prompt) {
    const sarahInput = document.getElementById('sarah-input');
    if (sarahInput) {
        sarahInput.value = prompt;
        sendSarahMessage();
    }
}

function sendSarahMessage() {
    const sarahInput = document.getElementById('sarah-input');
    const sarahMessages = document.getElementById('sarah-messages');
    
    if (!sarahInput || !sarahMessages) return;
    
    const message = sarahInput.value.trim();
    if (!message) return;
    
    // Add to conversation history
    sarahConversationHistory.push({ role: 'user', content: message });
    
    // Add user message to UI
    addSarahMessage(message, 'user');
    
    // Clear input
    sarahInput.value = '';
    
    // Show typing indicator
    showSarahTyping(true);
    
    // Process message with NLP and generate response
    setTimeout(() => {
        const response = processSarahMessage(message);
        showSarahTyping(false);
        addSarahMessage(response.text, 'bot');
        
        // Handle any actions that require confirmation
        if (response.needsConfirmation) {
            showSarahConfirmation(response.confirmMessage, response.action);
        } else if (response.action) {
            executeSarahAction(response.action);
        }
    }, 1500);
    
    // Scroll to bottom
    sarahMessages.scrollTop = sarahMessages.scrollHeight;
}

function addSarahMessage(message, sender) {
    const sarahMessages = document.getElementById('sarah-messages');
    if (!sarahMessages) return;
    
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const messageDiv = document.createElement('div');
    messageDiv.className = `sarah-message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="sarah-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${sender === 'user' ? (currentUser?.name || 'You') : 'SARAH'}</span>
                <span class="message-time">${currentTime}</span>
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    sarahMessages.appendChild(messageDiv);
    sarahMessages.scrollTop = sarahMessages.scrollHeight;
}

function showSarahTyping(show) {
    const typingIndicator = document.getElementById('sarah-typing');
    if (typingIndicator) {
        if (show) {
            typingIndicator.classList.remove('hidden');
        } else {
            typingIndicator.classList.add('hidden');
        }
    }
}

function processSarahMessage(message) {
    console.log('Processing SARAH message:', message);
    
    // Use advanced NLP to understand the message
    const analysis = sarahNLP.detectIntent(message);
    console.log('NLP Analysis:', analysis);
    
    let response = {
        text: '',
        action: null,
        needsConfirmation: false,
        confirmMessage: ''
    };
    
    // Generate response based on intent and action
    switch (analysis.intent) {
        case 'schedule':
            response = handleScheduleIntent(analysis, message);
            break;
        case 'inventory':
            response = handleInventoryIntent(analysis, message);
            break;
        case 'tasks':
            response = handleTasksIntent(analysis, message);
            break;
        case 'communication':
            response = handleCommunicationIntent(analysis, message);
            break;
        case 'clock':
            response = handleClockIntent(analysis, message);
            break;
        case 'help':
            response = handleHelpIntent(analysis, message);
            break;
        default:
            response.text = generateContextualResponse(message);
    }
    
    return response;
}

function handleScheduleIntent(analysis, message) {
    const entities = analysis.entities;
    let response = { text: '', action: null, needsConfirmation: false };
    
    switch (analysis.action) {
        case 'show':
            response.text = `Here's your current schedule:\n• Today: 9:00 AM - 5:00 PM (${getCurrentShift()})\n• Tomorrow: Training session at 2:00 PM\n• Friday: Team meeting at 10:00 AM`;
            response.action = { type: 'show_schedule' };
            break;
        case 'reschedule':
            if (entities.date && entities.time) {
                response.text = `I can reschedule your shift to ${entities.date} at ${entities.time}. This will require manager approval.`;
                response.needsConfirmation = true;
                response.confirmMessage = `Are you sure you want to reschedule your shift to ${entities.date} at ${entities.time}?`;
                response.action = { type: 'reschedule', date: entities.date, time: entities.time };
            } else {
                response.text = 'I can help you reschedule your shift. Please specify the date and time you prefer.';
            }
            break;
        default:
            response.text = 'I can help you view your schedule, request changes, or submit time-off requests. What would you like to do?';
    }
    
    return response;
}

function handleInventoryIntent(analysis, message) {
    let response = { text: '', action: null, needsConfirmation: false };
    
    switch (analysis.action) {
        case 'check':
            response.text = `Current inventory status:\n• 📱 iPhone 15 Cases: 5 units (⚠️ Low stock)\n• 📱 Samsung Galaxy Cases: 0 units (🔴 Out of stock)\n• 🎧 Bluetooth Headphones: 23 units (✅ Good)\n• 💻 Laptops: 12 units (✅ Good)`;
            response.action = { type: 'show_inventory' };
            break;
        case 'update':
            response.text = 'I can help you update inventory levels. Would you like me to create restock orders for low-stock items?';
            response.needsConfirmation = true;
            response.confirmMessage = 'Should I create restock orders for iPhone 15 Cases and Samsung Galaxy Cases?';
            response.action = { type: 'create_restock_orders' };
            break;
        case 'alert':
            response.text = '🚨 Low Stock Alert:\n• iPhone 15 Cases: Only 5 units left\n• Samsung Galaxy Cases: Out of stock\n\nI recommend restocking these items immediately.';
            response.action = { type: 'show_low_stock' };
            break;
        default:
            response.text = 'I can help you check inventory levels, create restock orders, or set up low-stock alerts. What would you like to do?';
    }
    
    return response;
}

function handleTasksIntent(analysis, message) {
    let response = { text: '', action: null, needsConfirmation: false };
    
    switch (analysis.action) {
        case 'create':
            const entities = analysis.entities;
            if (message.includes('create') || message.includes('new')) {
                response.text = `I'll create a new task for you. Based on your message, I'll set the priority as ${entities.priority || 'medium'}.`;
                response.action = { type: 'create_task', priority: entities.priority, person: entities.person };
            } else {
                response.text = 'I can create a new task. Please provide more details about what needs to be done.';
            }
            break;
        case 'update':
            if (message.includes('complete') || message.includes('done')) {
                response.text = 'I can mark your current tasks as completed. Which tasks would you like me to update?';
                response.needsConfirmation = true;
                response.confirmMessage = 'Mark all your ongoing tasks as completed?';
                response.action = { type: 'complete_tasks' };
            } else {
                response.text = 'I can update task statuses. What changes would you like to make?';
            }
            break;
        case 'summary':
            response.text = `📋 Task Summary:\n• 🔵 Open: 2 tasks\n• 🟡 In Progress: 1 task\n• ✅ Completed: 3 tasks today\n• ⏰ Due Today: 1 task\n\nYour next task: "${tasks[0]?.title || 'Stock iPhone Cases'}" due by 5:00 PM`;
            response.action = { type: 'show_tasks' };
            break;
        default:
            response.text = 'I can help you create tasks, update task statuses, or show your task summary. What would you like to do?';
    }
    
    return response;
}

function handleCommunicationIntent(analysis, message) {
    let response = { text: '', action: null, needsConfirmation: false };
    const entities = analysis.entities;
    
    if (entities.person) {
        response.text = `I can send a message to ${entities.person}. What would you like to tell them?`;
        response.needsConfirmation = true;
        response.confirmMessage = `Send message to ${entities.person}?`;
        response.action = { type: 'send_message', person: entities.person };
    } else if (message.includes('notify') || message.includes('manager')) {
        response.text = 'I\'ll notify your manager about this request.';
        response.action = { type: 'notify_manager' };
    } else {
        response.text = 'I can help you send messages to team members or notify your manager. Who would you like to contact?';
    }
    
    return response;
}

function handleClockIntent(analysis, message) {
    let response = { text: '', action: null, needsConfirmation: false };
    const currentTime = new Date().toLocaleTimeString();
    
    switch (analysis.action) {
        case 'in':
            response.text = `I'll clock you in now at ${currentTime}.`;
            response.needsConfirmation = true;
            response.confirmMessage = `Clock in at ${currentTime}?`;
            response.action = { type: 'clock_in', time: currentTime };
            break;
        case 'out':
            response.text = `I'll clock you out now at ${currentTime}.`;
            response.needsConfirmation = true;
            response.confirmMessage = `Clock out at ${currentTime}?`;
            response.action = { type: 'clock_out', time: currentTime };
            break;
        case 'status':
            response.text = `⏰ Time Status:\n• Clock in: 9:00 AM\n• Current time: ${currentTime}\n• Shift ends: 5:00 PM\n• Break taken: 12:00-12:30 PM`;
            response.action = { type: 'show_time_status' };
            break;
        default:
            response.text = `I can help you clock in, clock out, or check your time status. Current time is ${currentTime}.`;
    }
    
    return response;
}

function handleHelpIntent(analysis, message) {
    let response = { text: '', action: null, needsConfirmation: false };
    
    if (message.includes('issue') || message.includes('problem')) {
        response.text = 'I can help you report an issue. Would you like me to create a support ticket?';
        response.needsConfirmation = true;
        response.confirmMessage = 'Create a support ticket for this issue?';
        response.action = { type: 'create_support_ticket' };
    } else {
        response.text = `I'm here to help! Here's what I can assist you with:\n\n🕐 **Time Management**: Clock in/out, view schedule, request time off\n📦 **Inventory**: Check stock levels, create restock orders\n📋 **Tasks**: Create, update, and track your assignments\n💬 **Communication**: Send messages, notify managers\n📚 **Training**: Access modules, track progress\n🛠️ **Support**: Report issues, request assistance\n\nJust tell me what you need in natural language!`;
    }
    
    return response;
}

function generateContextualResponse(message) {
    // Fallback responses for unmatched intents
    const fallbackResponses = [
        "I understand you need help with that. Could you be more specific about what you'd like me to do?",
        "I'm here to assist you! I can help with scheduling, inventory, tasks, communication, and more. What would you like to work on?",
        "Let me help you with that. I can assist with various store operations. Could you clarify what you need?",
        "I'm SARAH, your AI assistant. I can help manage your work tasks, schedule, inventory, and more. What can I do for you today?"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function showSarahConfirmation(message, action) {
    const confirmModal = document.getElementById('sarah-confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    
    if (confirmModal && confirmMessage) {
        confirmMessage.textContent = message;
        pendingSarahAction = action;
        openModal('sarah-confirm-modal');
    }
}

function executePendingSarahAction() {
    if (pendingSarahAction) {
        executeSarahAction(pendingSarahAction);
        closeModal('sarah-confirm-modal');
        pendingSarahAction = null;
        
        // Add confirmation message to chat
        addSarahMessage('✅ Action completed successfully!', 'bot');
    }
}

function executeSarahAction(action) {
    console.log('Executing SARAH action:', action);
    
    switch (action.type) {
        case 'show_schedule':
            switchTab('overview');
            break;
        case 'show_inventory':
            switchTab('inventory');
            break;
        case 'show_tasks':
            switchTab('overview');
            break;
        case 'create_task':
            openModal('task-editor-modal');
            populateTaskAssigneeDropdown();
            clearTaskForm();
            break;
        case 'complete_tasks':
            // Mark ongoing tasks as completed
            tasks.forEach(task => {
                if (task.status === 'ongoing') {
                    task.status = 'completed';
                }
            });
            loadTasks();
            break;
        case 'clock_in':
        case 'clock_out':
            openModal('clock-in-out-modal');
            break;
        case 'create_restock_orders':
            switchTab('inventory');
            setTimeout(() => {
                alert('Restock orders created for iPhone 15 Cases and Samsung Galaxy Cases.');
            }, 500);
            break;
        case 'send_message':
            ChatUI.open();
            break;
        case 'notify_manager':
            alert('Your manager has been notified about your request.');
            break;
        case 'create_support_ticket':
            openModal('report-issue-modal');
            break;
        case 'reschedule':
            alert(`Schedule change request submitted for ${action.date} at ${action.time}. Waiting for manager approval.`);
            break;
        default:
            console.log('Unknown action type:', action.type);
    }
}

function getCurrentShift() {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 14) {
        return 'Morning Shift';
    } else if (currentHour >= 14 && currentHour < 22) {
        return 'Evening Shift';
    } else {
        return 'Night Shift';
    }
}

// Inventory Management
function setupInventoryEventListeners() {
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    const cycleCountBtn = document.getElementById('cycle-count-btn');
    const lowStockBtn = document.getElementById('low-stock-alert-btn');
    const createOrderBtn = document.getElementById('create-order-btn');
    
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', () => openModal('inventory-item-modal'));
    }
    
    if (cycleCountBtn) {
        cycleCountBtn.addEventListener('click', () => {
            alert('Cycle count feature would be implemented here.');
        });
    }
    
    if (lowStockBtn) {
        lowStockBtn.addEventListener('click', showLowStockAlert);
    }
    
    if (createOrderBtn) {
        createOrderBtn.addEventListener('click', () => openModal('place-order-modal'));
    }
}

function loadInventoryData() {
    loadInventoryList();
    loadRestockOrders();
}

function loadInventoryList() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    const inventory = [
        {
            id: 1,
            name: 'iPhone 15 Cases',
            category: 'Electronics',
            stock: 5,
            reorderPoint: 20,
            supplier: 'Tech Supplies Co',
            price: 29.99,
            status: 'low'
        },
        {
            id: 2,
            name: 'Samsung Galaxy Cases',
            category: 'Electronics',
            stock: 0,
            reorderPoint: 15,
            supplier: 'Tech Supplies Co',
            price: 24.99,
            status: 'out'
        },
        {
            id: 3,
            name: 'Bluetooth Headphones',
            category: 'Electronics',
            stock: 45,
            reorderPoint: 10,
            supplier: 'Audio Pro',
            price: 79.99,
            status: 'good'
        }
    ];
    
    inventoryList.innerHTML = inventory.map(item => `
        <div class="inventory-item ${item.status === 'low' ? 'low-stock' : item.status === 'out' ? 'out-of-stock' : ''}" data-item-id="${item.id}">
            <div class="inventory-info">
                <div class="inventory-name">${item.name}</div>
                <div class="inventory-details">
                    <span>${item.category}</span>
                    <span>Supplier: ${item.supplier}</span>
                    <span>Price: $${item.price}</span>
                </div>
            </div>
            <div class="inventory-actions">
                <span class="stock-level ${item.status}">${item.stock} units</span>
                <button class="btn btn--sm btn--secondary" onclick="editInventoryItem(${item.id})">Edit</button>
                ${item.stock <= item.reorderPoint ? `<button class="btn btn--sm btn--warning" onclick="reorderItem(${item.id})">Reorder</button>` : ''}
            </div>
        </div>
    `).join('');
}

function loadRestockOrders() {
    const restockOrders = document.getElementById('restock-orders');
    if (!restockOrders) return;
    
    const orders = [
        {
            id: 'ORD-001',
            item: 'iPhone 15 Cases',
            quantity: 50,
            supplier: 'Tech Supplies Co',
            status: 'pending',
            orderDate: 'Aug 5, 2025'
        },
        {
            id: 'ORD-002',
            item: 'Samsung Galaxy Cases',
            quantity: 30,
            supplier: 'Tech Supplies Co',
            status: 'shipped',
            orderDate: 'Aug 3, 2025'
        }
    ];
    
    restockOrders.innerHTML = orders.map(order => `
        <div class="restock-order">
            <div class="order-info">
                <div class="order-id">${order.id}</div>
                <div class="order-details">${order.item} - ${order.quantity} units from ${order.supplier}</div>
            </div>
            <span class="order-status ${order.status}">${order.status}</span>
        </div>
    `).join('');
}

function showLowStockAlert() {
    alert('Low Stock Alert:\n- iPhone 15 Cases: 5 units (reorder at 20)\n- Samsung Galaxy Cases: 0 units (out of stock)');
}

function editInventoryItem(itemId) {
    console.log('Edit inventory item:', itemId);
    openModal('inventory-item-modal');
}

function reorderItem(itemId) {
    console.log('Reorder item:', itemId);
    openModal('place-order-modal');
}

// Store Map and Planogram
function setupStoreMapEventListeners() {
    const planogramCheckBtn = document.getElementById('planogram-check-btn');
    const planogramCreateBtn = document.getElementById('planogram-create-btn');
    const layoutCreatorBtn = document.getElementById('layout-creator-btn');
    const generateReportBtn = document.getElementById('generate-report-btn');
    
    if (planogramCheckBtn) {
        planogramCheckBtn.addEventListener('click', () => {
            alert('Planogram camera check feature would be implemented here with AI analysis.');
        });
    }
    
    if (planogramCreateBtn) {
        planogramCreateBtn.addEventListener('click', () => {
            alert('Planogram creator tool would be implemented here.');
        });
    }
    
    if (layoutCreatorBtn) {
        layoutCreatorBtn.addEventListener('click', () => {
            alert('Store layout creator would be implemented here.');
        });
    }
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateStoreReport);
    }
}

function generateStoreReport() {
    alert('Store Report Generated:\n- Overall Compliance: 88%\n- Electronics: 92%\n- Clothing: 85%\n- Grocery: 90%\n- Home & Garden: 86%');
}

// Analytics Charts
function initializeCharts() {
    initializeSalesChart();
    initializeConversionChart();
    initializeDepartmentRevenueChart();
    initializeTrafficChart();
    initializeDepartmentChart();
    initializeProductivityChart();
}

function initializeSalesChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales ($)',
                data: [12000, 14500, 13200, 15800, 16200, 18500, 15420],
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function initializeConversionChart() {
    const ctx = document.getElementById('conversionChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Converted', 'Browsing'],
            datasets: [{
                data: [68, 32],
                backgroundColor: ['#1FB8CD', '#FFC185'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeDepartmentRevenueChart() {
    const ctx = document.getElementById('departmentRevenueChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Electronics', 'Clothing', 'Grocery', 'Home & Garden'],
            datasets: [{
                label: 'Revenue',
                data: [6200, 3800, 2900, 2520],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function initializeTrafficChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'],
            datasets: [{
                label: 'Customer Count',
                data: [15, 25, 35, 45, 38, 42, 48, 35, 28],
                borderColor: '#5D878F',
                backgroundColor: 'rgba(93, 135, 143, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializeDepartmentChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Sales', 'Customer Service', 'Inventory', 'Compliance', 'Training'],
            datasets: [{
                label: 'Performance',
                data: [85, 92, 78, 88, 94],
                borderColor: '#DB4545',
                backgroundColor: 'rgba(219, 69, 69, 0.2)',
                pointBackgroundColor: '#DB4545'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function initializeProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sarah J.', 'Mike C.', 'Emily T.', 'David P.'],
            datasets: [{
                label: 'Tasks Completed',
                data: [23, 19, 28, 15],
                backgroundColor: '#D2BA4C'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}