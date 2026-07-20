package com.example.ems.service;

import com.example.ems.dto.EmployeeRequest;
import com.example.ems.dto.EmployeeResponse;
import com.example.ems.exception.BadRequestException;
import com.example.ems.exception.DuplicateResourceException;
import com.example.ems.exception.ResourceNotFoundException;
import com.example.ems.model.AuditAction;
import com.example.ems.model.Department;
import com.example.ems.model.Employee;
import com.example.ems.model.EmployeeStatus;
import com.example.ems.repository.DepartmentRepository;
import com.example.ems.repository.EmployeeRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository, AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> search(String query, Long departmentId, EmployeeStatus status, Pageable pageable) {
        Specification<Employee> spec = buildSpecification(query, departmentId, status);
        return employeeRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private Specification<Employee> buildSpecification(String query, Long departmentId, EmployeeStatus status) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.isBlank()) {
                String like = "%" + query.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), like),
                        cb.like(cb.lower(root.get("lastName")), like),
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("employeeCode")), like),
                        cb.like(cb.lower(root.get("position")), like)
                ));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getDirectReports(Long managerId) {
        return employeeRepository.findByManagerId(managerId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllForDropdown() {
        return employeeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("An employee with email '" + request.getEmail() + "' already exists");
        }

        Employee employee = new Employee();
        applyRequest(employee, request);
        employee.setEmployeeCode(generateEmployeeCode());

        Employee saved = employeeRepository.save(employee);
        auditService.log("Employee", saved.getId(), AuditAction.CREATE,
                "Created employee " + saved.getFirstName() + " " + saved.getLastName());
        return toResponse(saved);
    }

    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee existing = findEntity(id);

        employeeRepository.findByEmailIgnoreCase(request.getEmail())
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> {
                    throw new DuplicateResourceException("An employee with email '" + request.getEmail() + "' already exists");
                });

        if (request.getManagerId() != null && request.getManagerId().equals(id)) {
            throw new BadRequestException("An employee cannot be their own manager");
        }

        applyRequest(existing, request);
        Employee saved = employeeRepository.save(existing);
        auditService.log("Employee", saved.getId(), AuditAction.UPDATE,
                "Updated employee " + saved.getFirstName() + " " + saved.getLastName());
        return toResponse(saved);
    }

    public void updateStatus(Long id, EmployeeStatus status) {
        Employee employee = findEntity(id);
        employee.setStatus(status);
        employeeRepository.save(employee);
        auditService.log("Employee", id, AuditAction.UPDATE, "Status changed to " + status);
    }

    public void deleteEmployee(Long id) {
        Employee employee = findEntity(id);
        employeeRepository.delete(employee);
        auditService.log("Employee", id, AuditAction.DELETE,
                "Deleted employee " + employee.getFirstName() + " " + employee.getLastName());
    }

    public byte[] exportToCsv() {
        List<Employee> employees = employeeRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println("Employee Code,First Name,Last Name,Email,Phone,Department,Position,Salary,Date of Joining,Status,Manager");
            for (Employee e : employees) {
                writer.printf("%s,%s,%s,%s,%s,%s,%s,%.2f,%s,%s,%s%n",
                        csv(e.getEmployeeCode()), csv(e.getFirstName()), csv(e.getLastName()), csv(e.getEmail()),
                        csv(e.getPhone()), csv(e.getDepartment() != null ? e.getDepartment().getName() : ""),
                        csv(e.getPosition()), e.getSalary() != null ? e.getSalary() : 0.0,
                        e.getDateOfJoining(), e.getStatus(),
                        csv(e.getManager() != null ? e.getManager().getFirstName() + " " + e.getManager().getLastName() : ""));
            }
        }
        return out.toByteArray();
    }

    private String csv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private void applyRequest(Employee employee, EmployeeRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setAddress(request.getAddress());
        employee.setDepartment(department);
        employee.setPosition(request.getPosition());
        employee.setSalary(request.getSalary());
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setPhotoUrl(request.getPhotoUrl());

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));
            employee.setManager(manager);
        } else {
            employee.setManager(null);
        }
    }

    private String generateEmployeeCode() {
        Set<String> existingCodes = employeeRepository.findAll().stream()
                .map(Employee::getEmployeeCode)
                .collect(Collectors.toSet());

        long count = employeeRepository.count() + 1;
        String candidate;
        do {
            candidate = String.format("EMP-%04d", count);
            count++;
        } while (existingCodes.contains(candidate));
        return candidate;
    }

    Employee findEntity(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public EmployeeResponse toResponse(Employee e) {
        EmployeeResponse dto = new EmployeeResponse();
        dto.setId(e.getId());
        dto.setEmployeeCode(e.getEmployeeCode());
        dto.setFirstName(e.getFirstName());
        dto.setLastName(e.getLastName());
        dto.setEmail(e.getEmail());
        dto.setPhone(e.getPhone());
        dto.setDateOfBirth(e.getDateOfBirth());
        dto.setGender(e.getGender());
        dto.setAddress(e.getAddress());
        if (e.getDepartment() != null) {
            dto.setDepartmentId(e.getDepartment().getId());
            dto.setDepartmentName(e.getDepartment().getName());
        }
        dto.setPosition(e.getPosition());
        dto.setSalary(e.getSalary());
        dto.setDateOfJoining(e.getDateOfJoining());
        dto.setStatus(e.getStatus());
        if (e.getManager() != null) {
            dto.setManagerId(e.getManager().getId());
            dto.setManagerName(e.getManager().getFirstName() + " " + e.getManager().getLastName());
        }
        dto.setPhotoUrl(e.getPhotoUrl());
        return dto;
    }
}
