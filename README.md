# Audit Framework for Web Applications

A comprehensive audit and versioning framework that tracks all data changes across multiple database tables within transactions. This framework provides transaction-based auditing, data change tracking, and versioning capabilities with a beautiful React frontend.

## 🚀 Features

- **Transaction-based Auditing**: Track all changes made within a single transaction
- **Multi-table Support**: Monitor changes across multiple database tables
- **Data Versioning**: Complete history of data modifications
- **Vibrant UI**: Modern React interface with beautiful visualizations
- **Javers-inspired Integration**: Professional audit framework for change tracking
- **Real-time Updates**: Live monitoring of data changes
- **Comprehensive Dashboard**: Visual analytics and statistics
- **Transaction Management**: Create, monitor, and complete transactions
- **Entity History**: Track changes for specific entities over time

## 🏗️ Architecture

```
audit-framework/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models (User, Product, Transaction, AuditLog)
│   │   ├── api/            # API endpoints (audit, transactions, users, products)
│   │   ├── services/       # Business logic (Javers-inspired audit service)
│   │   └── utils/          # Utilities
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # FastAPI application
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components (Layout, etc.)
│   │   ├── pages/          # Page components (Dashboard, Users, Products, etc.)
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── database/               # SQLite database files
```

## 🛠️ Tech Stack

- **Backend**: Python 3.8+, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Database**: SQLite (easily configurable for PostgreSQL/MySQL)
- **Audit Framework**: Custom Javers-inspired implementation
- **UI Components**: Lucide React icons, Recharts for visualizations

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd audit-framework

# Run the automated startup script
./start.sh
```

This script will:
- Check prerequisites
- Set up Python virtual environment
- Install all dependencies
- Start both backend and frontend servers

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌐 Access Points

Once both servers are running:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📊 How It Works

### 1. Transaction Management

1. **Create Transaction**: Start a new transaction boundary
2. **Perform Operations**: Make changes to users, products, or other entities
3. **Complete Transaction**: Finalize the transaction to commit all changes
4. **View Audit**: See all changes made within that transaction

### 2. Audit Tracking

The framework automatically tracks:
- **Entity Changes**: What was created, updated, or deleted
- **Value Changes**: Old vs new values for each field
- **Transaction Context**: Which transaction the change belongs to
- **User Context**: Who made the change
- **Timestamps**: When the change occurred

### 3. Data Models

- **Users**: Manage user accounts with audit tracking
- **Products**: Product catalog with versioning
- **Transactions**: Transaction boundaries and metadata
- **Audit Logs**: Detailed change history

## 🎯 Key Features Explained

### Transaction-Based Auditing

```python
# Start a transaction
transaction = await api_service.create_transaction({
    "description": "User registration and product creation",
    "user_id": 1
})

# Perform operations (automatically tracked)
user = await api_service.create_user(user_data)
product = await api_service.create_product(product_data)

# Complete transaction
await api_service.complete_transaction(transaction.transaction_id)
```

### Multi-Table Support

The framework tracks changes across multiple tables:
- Users table changes
- Products table changes
- Any custom entity tables
- All changes linked to the same transaction

### Visual Analytics

- **Dashboard**: Overview of audit statistics
- **Transaction Details**: Detailed view of all changes in a transaction
- **Entity History**: Timeline of changes for specific entities
- **Audit Logs**: Recent activity with filtering options

## 🔧 Configuration

### Database Configuration

The framework uses SQLite by default. To use PostgreSQL or MySQL:

1. Update `backend/app/database.py`
2. Install appropriate database driver
3. Update connection string

### Custom Entities

To add audit tracking to new entities:

1. Create model in `backend/app/models/`
2. Add API endpoints in `backend/app/api/`
3. Integrate with audit service
4. Add frontend components

## 📈 API Endpoints

### Audit Endpoints
- `GET /api/audit/transactions/{transaction_id}` - Get transaction audit
- `GET /api/audit/entity/{entity_type}/{entity_id}` - Get entity history
- `GET /api/audit/recent` - Get recent audit logs
- `GET /api/audit/summary` - Get audit summary statistics

### Transaction Endpoints
- `POST /api/transactions/` - Create transaction
- `POST /api/transactions/{id}/complete` - Complete transaction
- `GET /api/transactions/` - List transactions
- `GET /api/transactions/{id}` - Get transaction details

### Entity Endpoints
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

Similar endpoints exist for products and other entities.

## 🎨 Frontend Features

### Dashboard
- Real-time statistics
- Change type distribution charts
- Entity type breakdown
- Recent activity feed

### Transaction Management
- Create new transactions
- View transaction status
- Complete pending transactions
- Detailed transaction audit view

### Entity Management
- CRUD operations for users and products
- Real-time audit tracking
- Change history visualization
- Filtering and search capabilities

### Audit Logs
- Recent activity timeline
- Filter by time period
- Change type filtering
- Detailed change information

## 🔒 Security Considerations

- All changes are logged with user context
- Transaction boundaries prevent partial updates
- Audit logs are immutable
- API endpoints include proper validation
- CORS configured for development

## 🚀 Production Deployment

### Backend Deployment
1. Use production WSGI server (Gunicorn)
2. Configure environment variables
3. Set up proper database (PostgreSQL recommended)
4. Configure logging and monitoring

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with Nginx
3. Configure API proxy
4. Set up HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the audit logs for debugging
3. Check the transaction history
4. Open an issue on GitHub

## 🔮 Future Enhancements

- Real-time WebSocket updates
- Advanced filtering and search
- Export audit data
- Integration with external audit systems
- Machine learning for anomaly detection
- Advanced visualization options
