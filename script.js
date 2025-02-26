// Initialize data array and common variables
let entries = [];
let tags = [];
const commonTags = ["urgent", "customer", "payment", "refund", "cancellation", "high-priority", "training"];
const getCurrentISODateTime = () => new Date().toISOString(); // Function to get current ISO datetime
const currentDate = new Date().toISOString().split('T')[0];

// DOM Elements
const scriptForm = document.getElementById('scriptForm');
const cardsContainer = document.getElementById('cardsContainer');
const entriesTable = document.getElementById('entriesTable');
const searchInput = document.getElementById('searchInput');
const noDataDiv = document.getElementById('noData');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const tagsContainer = document.getElementById('tagsContainer');
const tagInput = document.getElementById('tagInput');
const tagSuggestions = document.getElementById('tagSuggestions');
const previewModal = document.getElementById('previewModal');

// Initialize the form with first card
function initializeForm() {
    addCard();
    updateTagSuggestions();
}

// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Add active class to current tab
        this.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Show selected tab content
        const tabId = this.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).classList.add('active');
        
        // If entries tab, refresh table
        if (this.getAttribute('data-tab') === 'entries') {
            updateTable();
        }
    });
});

// Function to add a new card
function addCard() {
    const cardCount = cardsContainer.children.length + 1;
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-item');
    const currentDateTime = getCurrentISODateTime();
    
    cardDiv.innerHTML = `
        <div class="card-item-header">
            <span class="card-item-number">Card #${cardCount}</span>
            <div class="card-actions">
                <button type="button" class="btn btn-sm btn-danger card-remove">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <button type="button" class="btn btn-sm card-move-up" ${cardCount === 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-sm card-move-down">
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
        </div>
        <div class="card-content-input">
            <input type="text" name="cards[]" class="form-control" placeholder="Enter script content for this card" required>
            <input type="hidden" name="cardCreated[]" value="${currentDateTime}">
            <input type="hidden" name="cardUpdated[]" value="${currentDateTime}">
        </div>
    `;
    
    cardsContainer.appendChild(cardDiv);
    
    // Update the move buttons for all cards
    updateMoveButtons();
    
    // Add event listeners for this card
    cardDiv.querySelector('.card-remove').addEventListener('click', function() {
        cardDiv.remove();
        renumberCards();
        updateMoveButtons();
    });
    
    cardDiv.querySelector('.card-move-up').addEventListener('click', function() {
        if (cardDiv.previousElementSibling) {
            cardsContainer.insertBefore(cardDiv, cardDiv.previousElementSibling);
            renumberCards();
            updateMoveButtons();
        }
    });
    
    cardDiv.querySelector('.card-move-down').addEventListener('click', function() {
        if (cardDiv.nextElementSibling) {
            cardsContainer.insertBefore(cardDiv.nextElementSibling, cardDiv);
            renumberCards();
            updateMoveButtons();
        }
    });
    
    // Add event listener to update the last update time when content changes
    cardDiv.querySelector('input[name="cards[]"]').addEventListener('input', function() {
        cardDiv.querySelector('input[name="cardUpdated[]"]').value = getCurrentISODateTime();
    });
}

// Function to renumber cards
function renumberCards() {
    const cards = cardsContainer.querySelectorAll('.card-item');
    cards.forEach((card, index) => {
        card.querySelector('.card-item-number').textContent = `Card #${index + 1}`;
    });
}

// Function to update move buttons
function updateMoveButtons() {
    const cards = cardsContainer.querySelectorAll('.card-item');
    cards.forEach((card, index) => {
        const upButton = card.querySelector('.card-move-up');
        const downButton = card.querySelector('.card-move-down');
        
        upButton.disabled = index === 0;
        downButton.disabled = index === cards.length - 1;
    });
}

// Function to show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = 'toast show toast-' + type;
    
    const iconElement = toast.querySelector('.toast-icon i');
    if (type === 'success') {
        iconElement.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        iconElement.className = 'fas fa-exclamation-circle';
    }
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Function to handle form submission
scriptForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cardValues = formData.getAll('cards[]');
    const cardCreatedValues = formData.getAll('cardCreated[]');
    const cardUpdatedValues = formData.getAll('cardUpdated[]');
    
    // Get tags
    const selectedTags = Array.from(tagsContainer.querySelectorAll('.tag')).map(
        tag => tag.getAttribute('data-tag')
    );
    
    // Create cards array with content and timestamps
    const cards = cardValues.map((content, index) => ({
        content,
        created: cardCreatedValues[index],
        updated: cardUpdatedValues[index]
    }));
    
    const currentDateTime = getCurrentISODateTime();
    
    const jsonOutput = {
        id: formData.get('id'),
        category: formData.get('category'),
        title: formData.get('title'),
        description: formData.get('description') || '',
        cards: cards,
        tags: selectedTags,
        created: currentDate,
        updated: currentDateTime
    };
    
    entries.push(jsonOutput);
    updateTable();
    showToast('Script saved successfully!');
    clearForm();
    
    // Switch to entries tab
    document.querySelector('.tab[data-tab="entries"]').click();
});

// Function to update the table with entries
function updateTable() {
    const tbody = entriesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (entries.length === 0) {
        noDataDiv.style.display = 'block';
        entriesTable.style.display = 'none';
        return;
    }
    
    noDataDiv.style.display = 'none';
    entriesTable.style.display = 'table';
    
    const filterText = searchInput.value.toLowerCase();
    const filteredEntries = filterText ? 
        entries.filter(entry => 
            entry.title.toLowerCase().includes(filterText) || 
            entry.id.toLowerCase().includes(filterText) ||
            entry.description.toLowerCase().includes(filterText) ||
            (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(filterText)))
        ) : 
        entries;
    
    filteredEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Format category with badge
        const categoryBadge = `<span class="badge badge-${entry.category}">${entry.category}</span>`;
        
        // Format cards count
        const cardsCount = entry.cards.length;
        
        // Format dates
        const createdDate = entry.created || 'N/A';
        const updatedDate = entry.updated ? new Date(entry.updated).toLocaleString() : 'N/A';
        
        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${entry.title}</td>
            <td>${categoryBadge}</td>
            <td>${cardsCount} card${cardsCount !== 1 ? 's' : ''}</td>
            <td>${createdDate}</td>
            <td>${updatedDate}</td>
            <td class="action-column">
                <button class="btn btn-sm view-btn" data-index="${index}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success edit-btn" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for action buttons
        row.querySelector('.view-btn').addEventListener('click', function() {
            showPreview(entries[this.getAttribute('data-index')]);
        });
        
        row.querySelector('.edit-btn').addEventListener('click', function() {
            const entryIndex = parseInt(this.getAttribute('data-index'));
            editEntry(entryIndex);
        });
        
        row.querySelector('.delete-btn').addEventListener('click', function() {
            const entryIndex = parseInt(this.getAttribute('data-index'));
            deleteEntry(entryIndex);
        });
    });
}

// Function to clear the form
function clearForm() {
    scriptForm.reset();
    
    // Clear cards container and add one empty card
    cardsContainer.innerHTML = '';
    addCard();
    
    // Clear tags
    tagsContainer.innerHTML = '';
}

// Function to show preview
function showPreview(entry) {
    const previewContentDiv = document.getElementById('previewContent');
    
    // Generate tags HTML
    const tagsHtml = entry.tags && entry.tags.length > 0 ? 
        `<div style="margin: 10px 0;">
            ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>` : '';
    
    // Generate cards HTML
    const cardsHtml = entry.cards.map((card, index) => {
        const cardCreated = card.created ? new Date(card.created).toLocaleString() : 'N/A';
        const cardUpdated = card.updated ? new Date(card.updated).toLocaleString() : 'N/A';
        
        return `
            <div style="background: #f5f7fb; padding: 15px; margin-bottom: 10px; border-radius: 6px;">
                <div style="margin-bottom: 5px; font-weight: 600;">Card #${index + 1}</div>
                <div>${card.content}</div>
                <div style="font-size: 11px; color: #718096; margin-top: 8px;">
                    Created: ${cardCreated} | Last Updated: ${cardUpdated}
                </div>
            </div>
        `;
    }).join('');
    
    // Format dates
    const createdDate = entry.created || 'N/A';
    const updatedDate = entry.updated ? new Date(entry.updated).toLocaleString() : 'N/A';
    
    previewContentDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span class="badge badge-${entry.category}" style="margin-right: 10px;">${entry.category}</span>
                <span style="font-size: 12px; color: #718096;">Created: ${createdDate} | Last Updated: ${updatedDate}</span>
            </div>
            <h3 style="margin-bottom: 5px;">${entry.title}</h3>
            <div style="color: #718096; margin-bottom: 10px;">${entry.id}</div>
            <p>${entry.description || 'No description provided.'}</p>
            ${tagsHtml}
        </div>
        <h4>Script Cards:</h4>
        ${cardsHtml}
    `;
    
    previewModal.style.display = 'block';
}

// Function to edit an entry
function editEntry(index) {
    const entry = entries[index];
    
    // Switch to form tab
    document.querySelector('.tab[data-tab="form"]').click();
    
    // Fill form with entry data
    document.getElementById('scriptId').value = entry.id;
    document.getElementById('category').value = entry.category;
    document.getElementById('title').value = entry.title;
    document.getElementById('description').value = entry.description || '';
    
    // Clear cards container
    cardsContainer.innerHTML = '';
    
    // Add cards from entry
    entry.cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-item');
        const cardCount = cardsContainer.children.length + 1;
        const currentDateTime = getCurrentISODateTime();
        
        // Ensure card has created and updated timestamps
        const cardCreated = card.created || currentDateTime;
        const cardUpdated = currentDateTime; // Update timestamp since we're editing
        
        cardDiv.innerHTML = `
            <div class="card-item-header">
                <span class="card-item-number">Card #${cardCount}</span>
                <div class="card-actions">
                    <button type="button" class="btn btn-sm btn-danger card-remove">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button type="button" class="btn btn-sm card-move-up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" class="btn btn-sm card-move-down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
            <div class="card-content-input">
                <input type="text" name="cards[]" class="form-control" value="${card.content}" required>
                <input type="hidden" name="cardCreated[]" value="${cardCreated}">
                <input type="hidden" name="cardUpdated[]" value="${cardUpdated}">
            </div>
        `;
        
        cardsContainer.appendChild(cardDiv);
        
        // Add event listeners for this card
        cardDiv.querySelector('.card-remove').addEventListener('click', function() {
            cardDiv.remove();
            renumberCards();
            updateMoveButtons();
        });
        
        cardDiv.querySelector('.card-move-up').addEventListener('click', function() {
            if (cardDiv.previousElementSibling) {
                cardsContainer.insertBefore(cardDiv, cardDiv.previousElementSibling);
                renumberCards();
                updateMoveButtons();
            }
        });
        
        cardDiv.querySelector('.card-move-down').addEventListener('click', function() {
            if (cardDiv.nextElementSibling) {
                cardsContainer.insertBefore(cardDiv.nextElementSibling, cardDiv);
                renumberCards();
                updateMoveButtons();
            }
        });
        
        // Add event listener to update the last update time when content changes
        cardDiv.querySelector('input[name="cards[]"]').addEventListener('input', function() {
            cardDiv.querySelector('input[name="cardUpdated[]"]').value = getCurrentISODateTime();
        });
    });
    
    // Update card move buttons
    renumberCards();
    updateMoveButtons();
    
    // Add tags
    if (entry.tags && entry.tags.length > 0) {
        tagsContainer.innerHTML = '';
        entry.tags.forEach(tag => addTag(tag));
    }
    
    // Remove the entry from the list (will be re-added on submit)
    entries.splice(index, 1);
    
    showToast('Loaded script for editing');
}

// Function to delete an entry
function deleteEntry(index) {
    if (confirm('Are you sure you want to delete this script?')) {
        entries.splice(index, 1);
        updateTable();
        showToast('Script deleted successfully');
    }
}

// Function to clear the table
function clearTable() {
    if (confirm('Are you sure you want to clear all scripts? This cannot be undone!')) {
        entries = [];
        updateTable();
        showToast('All scripts cleared successfully');
    }
}

// Function to download JSON
function downloadJSON() {
    if (entries.length === 0) {
        showToast('No scripts to export', 'error');
        return;
    }
    
    const filename = document.getElementById('exportFilename').value || 'script_entries';
    const format = document.getElementById('exportFormat').value;
    
    if (format === 'json') {
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        link.click();
    } else if (format === 'csv') {
        // Enhanced CSV export with timestamps
        let csvContent = 'Script ID,Category,Title,Description,Number of Cards,Created,Last Updated\n';
        
        entries.forEach(entry => {
            csvContent += `"${entry.id}","${entry.category}","${entry.title}","${entry.description}",${entry.cards.length},"${entry.created || ''}","${entry.updated || ''}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    }
    
    showToast(`Scripts exported as ${format.toUpperCase()} successfully`);
}

// Function to handle file import
function handleFileImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a file to import', 'error');
        return;
    }
    
    if (file.type !== 'application/json') {
        showToast('Please select a JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedEntries = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedEntries)) {
                showToast('Invalid JSON format. Expected an array of script entries.', 'error');
                return;
            }
            
            // Validate entries and add timestamps if missing
            const currentDateTime = getCurrentISODateTime();
            const validEntries = importedEntries.filter(entry => 
                entry.id && entry.title && Array.isArray(entry.cards)
            ).map(entry => {
                // Ensure entry has updated timestamp
                if (!entry.updated) {
                    entry.updated = currentDateTime;
                }
                
                // Ensure all cards have created and updated timestamps
                if (entry.cards) {
                    entry.cards = entry.cards.map(card => ({
                        content: card.content,
                        created: card.created || currentDateTime,
                        updated: card.updated || currentDateTime
                    }));
                }
                
                return entry;
            });
            
            if (validEntries.length === 0) {
                showToast('No valid script entries found in the file', 'error');
                return;
            }
            
            // Ask if user wants to replace or merge
            const action = confirm('Do you want to replace existing scripts? Click OK to replace or Cancel to merge.');
            
            if (action) {
                entries = validEntries;
            } else {
                entries = entries.concat(validEntries);
            }
            
            updateTable();
            showToast(`${validEntries.length} scripts imported successfully`);
            
            // Switch to entries tab
            document.querySelector('.tab[data-tab="entries"]').click();
            
        } catch (error) {
            console.error(error);
            showToast('Error parsing JSON file', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Tags functionality
function updateTagSuggestions() {
    tagSuggestions.innerHTML = '';
    
    // Combine common tags with used tags
    const allTags = [...new Set([...commonTags, ...tags])];
    
    allTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.classList.add('tag-suggestion-item');
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => {
            addTag(tag);
            tagInput.value = '';
            tagSuggestions.classList.remove('show');
        });
        
        tagSuggestions.appendChild(tagElement);
    });
}

function addTag(tag) {
    // Check if tag already exists
    if (Array.from(tagsContainer.querySelectorAll('.tag')).some(
        el => el.getAttribute('data-tag') === tag
    )) {
        return;
    }
    
    const tagElement = document.createElement('div');
    tagElement.classList.add('tag');
    tagElement.setAttribute('data-tag', tag);
    tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove"><i class="fas fa-times"></i></span>
    `;
    
    tagElement.querySelector('.tag-remove').addEventListener('click', function() {
        tagElement.remove();
    });
    
    tagsContainer.appendChild(tagElement);
    
    // Add to tags list if not already there
    if (!tags.includes(tag)) {
        tags.push(tag);
        updateTagSuggestions();
    }
}

// Event Listeners
document.getElementById('addCardBtn').addEventListener('click', addCard);
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('clearTableBtn').addEventListener('click', clearTable);
document.getElementById('exportBtn').addEventListener('click', function() {
    document.querySelector('.tab[data-tab="import-export"]').click();
});
document.getElementById('mobileExportBtn').addEventListener('click', function() {
    document.querySelector('.tab[data-tab="import-export"]').click();
});
document.getElementById('importBtn').addEventListener('click', function() {
    document.querySelector('.tab[data-tab="import-export"]').click();
});
document.getElementById('mobileImportBtn').addEventListener('click', function() {
    document.querySelector('.tab[data-tab="import-export"]').click();
});
document.getElementById('processExportBtn').addEventListener('click', downloadJSON);
document.getElementById('processImportBtn').addEventListener('click', handleFileImport);
document.getElementById('previewBtn').addEventListener('click', function() {
    // Create a temporary object from the form
    const formData = new FormData(scriptForm);
    const cardValues = formData.getAll('cards[]');
    const cardCreatedValues = formData.getAll('cardCreated[]');
    const cardUpdatedValues = formData.getAll('cardUpdated[]');
    
    // Create cards array with content and timestamps
    const cards = cardValues.map((content, index) => ({
        content,
        created: cardCreatedValues[index],
        updated: cardUpdatedValues[index]
    }));
    
    const currentDateTime = getCurrentISODateTime();
    
    const tempEntry = {
        id: formData.get('id'),
        category: formData.get('category'),
        title: formData.get('title'),
        description: formData.get('description') || '',
        cards: cards,
        tags: Array.from(tagsContainer.querySelectorAll('.tag')).map(
            tag => tag.getAttribute('data-tag')
        ),
        created: currentDate,
        updated: currentDateTime
    };
    
    showPreview(tempEntry);
});
document.getElementById('closePreviewBtn').addEventListener('click', function() {
    previewModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === previewModal) {
        previewModal.style.display = 'none';
    }
});

searchInput.addEventListener('input', updateTable);

// Tag input event listeners
tagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        addTag(this.value.trim());
        this.value = '';
        tagSuggestions.classList.remove('show');
    }
});

tagInput.addEventListener('focus', function() {
    if (tagSuggestions.children.length > 0) {
        tagSuggestions.classList.add('show');
    }
});

tagInput.addEventListener('blur', function() {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
        tagSuggestions.classList.remove('show');
    }, 200);
});

// Handle mobile header actions
function handleResponsive() {
    if (window.innerWidth <= 768) {
        document.querySelector('.mobile-header-actions').style.display = 'flex';
    } else {
        document.querySelector('.mobile-header-actions').style.display = 'none';
    }
}

window.addEventListener('resize', handleResponsive);

// Initialize the form and UI
initializeForm();
handleResponsive();
updateTable();

// Sample data for testing
function addSampleData() {
    const currentDateTime = getCurrentISODateTime();
    
    entries = [
        {
            id: "Opening",
            category: "chat",
            title: "Chat Greeting",
            description: "Use this greeting to start a chat conversation with a customer",
            cards: [
                { 
                    content: "Hello! Thank you for contacting our support team. My name is [Your Name], and I'll be helping you today.",
                    created: currentDateTime,
                    updated: currentDateTime
                },
                { 
                    content: "To better assist you, could you please provide your order number or account email address?",
                    created: currentDateTime,
                    updated: currentDateTime
                },
                { 
                    content: "Thank you for providing that information. I'm accessing your account details now. How may I help you today?",
                    created: currentDateTime,
                    updated: currentDateTime
                }
            ],
            tags: ["greeting", "chat", "opening"],
            created: "2025-02-24",
            updated: currentDateTime
        },
        {
            id: "Payment",
            category: "voice",
            title: "Payment Issue Resolution",
            description: "Guide for handling payment processing issues on calls",
            cards: [
                { 
                    content: "I understand you're experiencing issues with your payment. Let me help you resolve this.",
                    created: currentDateTime,
                    updated: currentDateTime
                },
                { 
                    content: "Could you please verify the last four digits of the card you're trying to use?",
                    created: currentDateTime,
                    updated: currentDateTime
                },
                { 
                    content: "Thank you. Let me check what might be causing the issue with this payment method.",
                    created: currentDateTime,
                    updated: currentDateTime
                },
                { 
                    content: "Based on what I'm seeing, [explain issue]. Would you like to try an alternative payment method?",
                    created: currentDateTime,
                    updated: currentDateTime
                }
            ],
            tags: ["payment", "troubleshooting"],
            created: "2025-02-23",
            updated: currentDateTime
        }
    ];
    
    updateTable();
}

// Uncomment to add sample data for testing
// addSampleData();
