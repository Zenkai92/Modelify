import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logique d'envoi du formulaire
    console.log('Formulaire de contact soumis:', formData);
    alert('Message envoyé ! Nous vous recontacterons bientôt.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="text-center mb-5">Contactez-nous</h1>
          
          <div className="row mb-5">
            <div className="col-md-4 text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-envelope fa-2x text-primary"></i>
              </div>
              <h5>Email</h5>
              <p>contact@modelify.fr</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-phone fa-2x text-primary"></i>
              </div>
              <h5>Téléphone</h5>
              <p>+33 1 23 45 67 89</p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <div className="mb-3">
                <i className="fas fa-clock fa-2x text-primary"></i>
              </div>
              <h5>Horaires</h5>
              <p>Lun-Ven: 9h-18h</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="subject" className="form-label">Sujet *</label>
              <input
                type="text"
                className="form-control"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="message" className="form-label">Message *</label>
              <textarea
                className="form-control"
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="text-center">
              <button type="submit" className="btn btn-primary btn-lg">
                Envoyer le message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;