# Hospital Polaco de Buenos Aires

## Descripción General
This project represents the web portal for the **Polish Hospital of Buenos Aires**, where medical appointments, consultations, and patient and specialist management can be efficiently handled. It facilitates interaction between patients, specialists, and administrators in a secure and user-friendly environment.

The hospital has six consultation rooms, two physical laboratories, and a general waiting room. Operating hours are Monday to Friday from 8:00 AM to 7:00 PM, and Saturdays from 8:00 AM to 2:00 PM.

## Deploy

You can access the web portal via the following link:

[Polish Hospital Portal - Live Demo](https://segundo-examen-labo-iv.web.app/home)

## System Screens and Sections

### Welcome Page
The homepage provides an introduction to the **Polish Hospital of Buenos Aires** and offers direct access to the **login** and **registration** sections.
- **Access Points**: Login and Registration.
- **Content**: Welcome message and a brief description of the clinic.

![Home](./img/home.png)

### User Registration
This section allows users to register as patients or specialists.
- **Patient Data**: First name, last name, age, ID, insurance, email, password, and 2 profile images.
- **Specialist Data**: First name, last name, age, ID, specialty (with the ability to add new ones), email, password, and a profile image.
- **Validations**: All fields include proper validation to ensure data integrity.
- **Captcha**: A Google reCAPTCHA is integrated to secure the registration process.

![Registration](./img/registro.png)

### Login
The login module allows users to authenticate and access the platform.
- **Quick Access**: Predefined users are available for easy testing.
- **Validations**: Only verified accounts can log in.
- **Restrictions**: Specialists can access the portal only after their account has been approved by an administrator.

![Login](./img/login.png)

### Administration Panel (User Section)
Accessible only to administrators, this section allows for user management.
- **Actions**: Approve specialists, enable/disable user accounts, and create new users (patients, specialists, and administrators).
- **View Details**: Detailed user information, including profile images.
- **Excel Export**: Download user data in Excel format for administrative purposes.

![Users](./img/usuarios.png)

### Book Appointments
This section allows patients and administrators to book appointments quickly and easily.
- **Selection Options**: Specialty, specialist, date, and time.
- **Restrictions**: Patients can book appointments up to 15 days in advance based on specialist availability.

![Book Appointment 1](./img/solicitar-turno.png)
![Book Appointment 2](./img/solicitar-turno2.png)

### My Appointments (Patients and Specialists)
This section enables users to view and manage their appointments.
- **Patients**:
  - View requested appointments and cancel those that have not yet occurred.
  - Filter by specialty and specialist (without using dropdown menus).
  - Rate the service and leave comments once the appointment is completed.
- **Specialists**:
  - View assigned appointments with options to accept, reject, cancel, or mark them as completed.
  - Add a review or diagnosis after completing an appointment.

![My Appointments 1](./img/mis-turnos.png)
![My Appointments 2](./img/mis-turnos2.png)

### My Profile
In this section, users can view and update their personal information, including profile images and other relevant details.
- **Patients**: Access their medical history and contact details.
- **Specialists**: Adjust availability schedules, considering they may have multiple associated specialties.

![My Profile](./img/perfil.png)

### Medical History
Specialists can add and view the medical history of patients they have attended at least once.
- **Fixed Data**: Height, weight, temperature, and blood pressure.
- **Dynamic Data**: Up to three additional fields with key-value pairs, such as "cavities: 4".
- **Access**: Available from the "My Profile" section for patients and from the "Users" section for administrators.

![Medical History](./img/historia-clinica.png)

### Reports and Statistics
Accessible only to administrators, this section provides statistics and charts about system usage.
- **Available Reports**:
  - System login logs, including user, date, and time.
  - Number of appointments per specialty and day.
  - Appointments requested and completed by each doctor within a time interval.
- **Downloads**: Charts and reports can be downloaded in PDF or Excel format.

![Reports](./img/informes.png)

## Navigation and Section Access
- **System Access**: Users can log in via the homepage.
- **Registration**: Available on the homepage for patients and specialists.
- **Admin Panel**: Only accessible to administrators after logging in.
- **My Appointments**: Accessible from the user menu for patients and specialists.
- **My Profile**: Accessible from the top navigation bar after logging in.

## Technologies Used
- **Framework**: Angular
- **Backend**: Firebase
- **Database**: Firestore
- **Styling**: CSS and Bootstrap for responsive design
- **Security**: Google reCAPTCHA for user registration protection

<div style="text-align:center">
  <img src="./UTN_logo.png" alt="UTN Logo" width="450"/>
</div>
