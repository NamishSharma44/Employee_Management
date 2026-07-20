package com.example.ems.service;

import com.example.ems.dto.DepartmentDtos.DepartmentRequest;
import com.example.ems.dto.DepartmentDtos.DepartmentResponse;
import com.example.ems.exception.DuplicateResourceException;
import com.example.ems.exception.ResourceNotFoundException;
import com.example.ems.model.AuditAction;
import com.example.ems.model.Department;
import com.example.ems.model.Employee;
import com.example.ems.repository.DepartmentRepository;
import com.example.ems.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public DepartmentService(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository, AuditService auditService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("A department named '" + request.getName() + "' already exists");
        }
        Department department = new Department();
        applyRequest(department, request);
        Department saved = departmentRepository.save(department);
        auditService.log("Department", saved.getId(), AuditAction.CREATE, "Created department " + saved.getName());
        return toResponse(saved);
    }

    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = findEntity(id);
        departmentRepository.findByNameIgnoreCase(request.getName())
                .filter(d -> !d.getId().equals(id))
                .ifPresent(d -> {
                    throw new DuplicateResourceException("A department named '" + request.getName() + "' already exists");
                });
        applyRequest(department, request);
        Department saved = departmentRepository.save(department);
        auditService.log("Department", saved.getId(), AuditAction.UPDATE, "Updated department " + saved.getName());
        return toResponse(saved);
    }

    public void delete(Long id) {
        Department department = findEntity(id);
        if (employeeRepository.countByDepartmentId(id) > 0) {
            throw new com.example.ems.exception.BadRequestException(
                    "Cannot delete department with active employees assigned to it. Reassign them first.");
        }
        departmentRepository.delete(department);
        auditService.log("Department", id, AuditAction.DELETE, "Deleted department " + department.getName());
    }

    private void applyRequest(Department department, DepartmentRequest request) {
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setLocation(request.getLocation());
        if (request.getHeadId() != null) {
            Employee head = employeeRepository.findById(request.getHeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getHeadId()));
            department.setHead(head);
        } else {
            department.setHead(null);
        }
    }

    private Department findEntity(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    private DepartmentResponse toResponse(Department d) {
        DepartmentResponse dto = new DepartmentResponse();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setDescription(d.getDescription());
        dto.setLocation(d.getLocation());
        if (d.getHead() != null) {
            dto.setHeadId(d.getHead().getId());
            dto.setHeadName(d.getHead().getFirstName() + " " + d.getHead().getLastName());
        }
        dto.setEmployeeCount(employeeRepository.countByDepartmentId(d.getId()));
        return dto;
    }
}
