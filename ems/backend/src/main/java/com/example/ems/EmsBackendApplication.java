package com.example.ems;

import com.example.ems.model.*;
import com.example.ems.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@SpringBootApplication
public class EmsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmsBackendApplication.class, args);
    }

    @Bean
    CommandLineRunner seedDatabase(DepartmentRepository departmentRepo, EmployeeRepository employeeRepo,
                                    UserRepository userRepo, LeaveRequestRepository leaveRepo,
                                    PasswordEncoder passwordEncoder) {
        return args -> {
            if (employeeRepo.count() > 0) return;

            // ---- Departments (created without heads first) ----
            Department engineering = departmentRepo.save(new Department(null, "Engineering", "Builds and maintains our products", "Bengaluru", null));
            Department design = departmentRepo.save(new Department(null, "Design", "Product design and user experience", "Bengaluru", null));
            Department marketing = departmentRepo.save(new Department(null, "Marketing", "Brand, growth, and communications", "Mumbai", null));
            Department hr = departmentRepo.save(new Department(null, "Human Resources", "People operations and talent", "Delhi", null));
            Department finance = departmentRepo.save(new Department(null, "Finance", "Accounting and financial planning", "Mumbai", null));

            // ---- Department heads / managers (no manager themselves) ----
            Employee aarav = employee(employeeRepo, "EMP-0001", "Aarav", "Sharma", "aarav.sharma@company.com",
                    "555-0101", engineering, "Engineering Manager", 145000.0, LocalDate.of(2021, 3, 14),
                    Gender.MALE, null);
            Employee ishita = employee(employeeRepo, "EMP-0002", "Ishita", "Verma", "ishita.verma@company.com",
                    "555-0102", design, "Design Lead", 118000.0, LocalDate.of(2021, 7, 1),
                    Gender.FEMALE, null);
            Employee sneha = employee(employeeRepo, "EMP-0003", "Sneha", "Kapoor", "sneha.kapoor@company.com",
                    "555-0104", marketing, "Marketing Lead", 98000.0, LocalDate.of(2020, 11, 9),
                    Gender.FEMALE, null);
            Employee vikram = employee(employeeRepo, "EMP-0005", "Vikram", "Nair", "vikram.nair@company.com",
                    "555-0105", hr, "HR Manager", 104000.0, LocalDate.of(2019, 5, 18),
                    Gender.MALE, null);
            Employee karan = employee(employeeRepo, "EMP-0007", "Karan", "Malhotra", "karan.malhotra@company.com",
                    "555-0107", finance, "Finance Manager", 121000.0, LocalDate.of(2020, 2, 3),
                    Gender.MALE, null);

            // ---- Direct reports ----
            Employee rohan = employee(employeeRepo, "EMP-0008", "Rohan", "Mehta", "rohan.mehta@company.com",
                    "555-0103", engineering, "Backend Developer", 92000.0, LocalDate.of(2024, 1, 22),
                    Gender.MALE, aarav);
            Employee ananya = employee(employeeRepo, "EMP-0009", "Ananya", "Iyer", "ananya.iyer@company.com",
                    "555-0110", engineering, "Frontend Developer", 88000.0, LocalDate.of(2024, 4, 8),
                    Gender.FEMALE, aarav);
            Employee dev = employee(employeeRepo, "EMP-0010", "Dev", "Patel", "dev.patel@company.com",
                    "555-0111", engineering, "DevOps Engineer", 97000.0, LocalDate.of(2023, 9, 12),
                    Gender.MALE, aarav);
            Employee meera = employee(employeeRepo, "EMP-0011", "Meera", "Joshi", "meera.joshi@company.com",
                    "555-0112", design, "UI Designer", 76000.0, LocalDate.of(2023, 6, 19),
                    Gender.FEMALE, ishita);
            Employee arjun = employee(employeeRepo, "EMP-0013", "Arjun", "Rao", "arjun.rao@company.com",
                    "555-0114", marketing, "Marketing Executive", 62000.0, LocalDate.of(2024, 2, 26),
                    Gender.MALE, sneha);
            Employee priya = employee(employeeRepo, "EMP-0015", "Priya", "Singh", "priya.singh@company.com",
                    "555-0116", hr, "HR Executive", 58000.0, LocalDate.of(2023, 10, 2),
                    Gender.FEMALE, vikram);
            Employee neha = employee(employeeRepo, "EMP-0017", "Neha", "Gupta", "neha.gupta@company.com",
                    "555-0118", finance, "Accountant", 67000.0, LocalDate.of(2022, 8, 15),
                    Gender.FEMALE, karan);

            // ---- Assign department heads now that employees exist ------
            engineering.setHead(aarav);
            design.setHead(ishita);
            marketing.setHead(sneha);
            hr.setHead(vikram);
            finance.setHead(karan);
            departmentRepo.saveAll(java.util.List.of(engineering, design, marketing, hr, finance));

            // ---- Users (login accounts) -----
            userRepo.save(new User(null, "admin", passwordEncoder.encode("admin123"), Role.ADMIN, true, null));
            userRepo.save(new User(null, "manager", passwordEncoder.encode("manager123"), Role.MANAGER, true, aarav));
            userRepo.save(new User(null, "employee", passwordEncoder.encode("employee123"), Role.EMPLOYEE, true, rohan));

            // ---- Sample leave requests -----
            leave(leaveRepo, rohan, LeaveType.SICK, LocalDate.now().minusDays(10), LocalDate.now().minusDays(8),
                    "Fever and flu", LeaveStatus.APPROVED, "manager", LocalDateTime.now().minusDays(9));
            leave(leaveRepo, ananya, LeaveType.CASUAL, LocalDate.now().plusDays(3), LocalDate.now().plusDays(4),
                    "Family function", LeaveStatus.PENDING, null, null);
            leave(leaveRepo, meera, LeaveType.EARNED, LocalDate.now().plusDays(10), LocalDate.now().plusDays(15),
                    "Annual vacation", LeaveStatus.PENDING, null, null);
            leave(leaveRepo, arjun, LeaveType.UNPAID, LocalDate.now().minusDays(20), LocalDate.now().minusDays(18),
                    "Personal reasons", LeaveStatus.REJECTED, "manager", LocalDateTime.now().minusDays(19));
            leave(leaveRepo, priya, LeaveType.CASUAL, LocalDate.now().minusDays(2), LocalDate.now().minusDays(1),
                    "Moving apartments", LeaveStatus.APPROVED, "admin", LocalDateTime.now().minusDays(2));
        };
    }

    private Employee employee(EmployeeRepository repo, String code, String first, String last, String email,
                               String phone, Department dept, String position, Double salary, LocalDate doj,
                               Gender gender, Employee manager) {
        Employee e = new Employee();
        e.setEmployeeCode(code);
        e.setFirstName(first);
        e.setLastName(last);
        e.setEmail(email);
        e.setPhone(phone);
        e.setDepartment(dept);
        e.setPosition(position);
        e.setSalary(salary);
        e.setDateOfJoining(doj);
        e.setGender(gender);
        e.setStatus(EmployeeStatus.ACTIVE);
        e.setManager(manager);
        return repo.save(e);
    }

    private void leave(LeaveRequestRepository repo, Employee employee, LeaveType type, LocalDate start, LocalDate end,
                        String reason, LeaveStatus status, String reviewedBy, LocalDateTime reviewedOn) {
        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(employee);
        lr.setLeaveType(type);
        lr.setStartDate(start);
        lr.setEndDate(end);
        lr.setReason(reason);
        lr.setStatus(status);
        lr.setAppliedOn(start.atStartOfDay().minusDays(2));
        lr.setReviewedBy(reviewedBy);
        lr.setReviewedOn(reviewedOn);
        repo.save(lr);
    }
}
