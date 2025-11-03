import Database from '@tauri-apps/plugin-sql';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  // Conecta-se ao banco de dados pré-carregado
  async open() {
    try {
      // "sqlite:tvusvet.db" deve corresponder ao que você definiu no tauri.config.json
      this.db = await Database.load("sqlite:tvusvet.db");
      console.log("Banco de dados Tauri-SQL carregado com sucesso.");
    } catch (error) {
      console.error("Erro ao carregar o banco de dados:", error);
      throw error;
    }
  }

  // Executa uma consulta que não retorna dados (CREATE, INSERT, UPDATE, DELETE)
  async execute(sql, params = []) {
    if (!this.db) await this.open();
    try {
      const result = await this.db.execute(sql, params);
      return result;
    } catch (error) {
      console.error("Erro ao executar:", sql, params, error);
      throw error;
    }
  }

  // Executa uma consulta que retorna dados (SELECT)
  async query(sql, params = []) {
    if (!this.db) await this.open();
    try {
      const results = await this.db.select(sql, params);
      return results;
    } catch (error) {
      console.error("Erro ao consultar:", sql, params, error);
      throw error;
    }
  }

  // Esta função é chamada pelo App.js para criar as tabelas
  async createTables() {
    if (!this.db) await this.open();
    
    // Usamos executeBatch para rodar múltiplos comandos
    // ATENÇÃO: O tauri-plugin-sql não suporta `executeBatch` nativamente
    // Vamos executar um de cada vez.
    const tablesSql = [
      `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species TEXT,
        breed TEXT,
        owner_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        exam_type TEXT NOT NULL,
        exam_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS reference_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_type TEXT NOT NULL,
        species TEXT NOT NULL,
        organ TEXT NOT NULL,
        measurement TEXT NOT NULL,
        min_value REAL,
        max_value REAL,
        unit TEXT,
        UNIQUE(exam_type, species, organ, measurement)
      );`
    ];

    try {
      // Executa cada comando de criação de tabela individualmente
      for (const sql of tablesSql) {
        await this.db.execute(sql);
      }
      console.log("Tabelas criadas ou verificadas com sucesso.");
    } catch (error) {
      console.error("Erro ao criar tabelas:", error);
    }
  }

  // Funções de CRUD (Exemplos convertidos)
  async getPatients() {
    return this.query("SELECT * FROM patients ORDER BY name ASC");
  }

  async addPatient(patient) {
    const sql = "INSERT INTO patients (name, species, breed, owner_name) VALUES (?, ?, ?, ?)";
    return this.execute(sql, [patient.name, patient.species, patient.breed, patient.owner_name]);
  }

  async updatePatient(patient) {
    const sql = "UPDATE patients SET name = ?, species = ?, breed = ?, owner_name = ? WHERE id = ?";
    return this.execute(sql, [patient.name, patient.species, patient.breed, patient.owner_name, patient.id]);
  }

  async deletePatient(id) {
    return this.execute("DELETE FROM patients WHERE id = ?", [id]);
  }
  
  async getExamsByPatientId(patientId) {
    return this.query("SELECT * FROM exams WHERE patient_id = ?", [patientId]);
  }

  async addExam(exam) {
    const sql = "INSERT INTO exams (patient_id, exam_type, exam_data) VALUES (?, ?, ?)";
    // O exam_data é um objeto, então o guardamos como string JSON
    const examDataString = JSON.stringify(exam.exam_data);
    return this.execute(sql, [exam.patient_id, exam.exam_type, examDataString]);
  }

  async updateExam(exam) {
    const sql = "UPDATE exams SET exam_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    const examDataString = JSON.stringify(exam.exam_data);
    return this.execute(sql, [examDataString, exam.id]);
  }

  async getExamById(id) {
    const results = await this.query("SELECT * FROM exams WHERE id = ?", [id]);
    if (results.length > 0) {
      // Convertemos o JSON string de volta para objeto
      try {
        results[0].exam_data = JSON.parse(results[0].exam_data);
      } catch (e) {
        console.error("Falha ao parsear exam_data:", e);
        results[0].exam_data = {}; // Retorna objeto vazio em caso de falha
      }
      return results[0];
    }
    return null;
  }
  
  async deleteExam(id) {
    return this.execute("DELETE FROM exams WHERE id = ?", [id]);
  }

  // Funções de Settings
  async getSettings() {
    const results = await this.query("SELECT * FROM settings");
    const settings = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  async saveSettings(key, value) {
    const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
    return this.execute(sql, [key, value]);
  }

  // Você precisará converter o resto das suas funções do database.js original
  // (getTemplates, addTemplate, updateTemplate, deleteTemplate, etc.)
  // O padrão é o mesmo:
  
  async getTemplates() {
    return this.query("SELECT * FROM templates ORDER BY name ASC");
  }
  
  async addTemplate(template) {
     const sql = "INSERT INTO templates (name, content) VALUES (?, ?)";
     return this.execute(sql, [template.name, template.content]);
  }
  
  async updateTemplate(template) {
     const sql = "UPDATE templates SET name = ?, content = ? WHERE id = ?";
     return this.execute(sql, [template.name, template.content, template.id]);
  }
  
  async deleteTemplate(id) {
     return this.execute("DELETE FROM templates WHERE id = ?", [id]);
  }
  
  //... etc para reference_values
}

export const db = new DatabaseService();