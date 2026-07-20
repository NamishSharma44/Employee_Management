package com.example.ems.service;

import com.example.ems.dto.LeaveDtos.LeaveCreateRequest;
import com.example.ems.dto.LeaveDtos.LeaveResponse;
import com.example.ems.dto.LeaveDtos.LeaveReviewRequest;
import com.example.ems.exception.BadRequestException;
import com.example.ems.exception.ResourceNotFoundException;
import com.example.ems.model.*;
import com.example.ems.repository.EmployeeRepository;
import com.example.ems.repository.LeaveRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public LeaveService(LeaveRequestRepository leaveRequestRepository, EmployeeRepository employeeRepository, AuditService auditService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    public LeaveResponse apply(LeaveCreateRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(employee);
        leave.setLeaveType(request.getLeaveType());
        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        leave.setReason(request.getReason());
        leave.setStatus(LeaveStatus.PENDING);
        leave.setAppliedOn(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leave);
        auditService.log("LeaveRequest", saved.getId(), AuditAction.CREATE,
                employee.getFirstName() + " applied for " + request.getLeaveType() + " leave");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<LeaveResponse> getByEmployee(Long employeeId, Pageable pageable) {
        return leaveRequestRepository.findByEmployeeId(employeeId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LeaveResponse> getByStatus(LeaveStatus status, Pageable pageable) {
        if (status == null) {
            return leaveRequestRepository.findAll(pageable).map(this::toResponse);
        }
        return leaveRequestRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    public LeaveResponse review(Long id, LeaveReviewRequest request) {
        if (request.getStatus() != LeaveStatus.APPROVED && request.getStatus() != LeaveStatus.REJECTED) {
            throw new BadRequestException("Decision must be APPROVED or REJECTED");
        }
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending leave requests can be reviewed");
        }

        leave.setStatus(request.getStatus());
        leave.setReviewComment(request.getComment());
        leave.setReviewedOn(LocalDateTime.now());
        leave.setReviewedBy(currentUsername());

        if (request.getStatus() == LeaveStatus.APPROVED) {
            Employee employee = leave.getEmployee();
            employee.setStatus(EmployeeStatus.ON_LEAVE);
            employeeRepository.save(employee);
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);
        auditService.log("LeaveRequest", saved.getId(),
                request.getStatus() == LeaveStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
                "Leave request " + request.getStatus());
        return toResponse(saved);
    }

    public LeaveResponse cancel(Long id, Long requestingEmployeeId) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));
        if (!leave.getEmployee().getId().equals(requestingEmployeeId)) {
            throw new BadRequestException("You can only cancel your own leave requests");
        }
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BadRequestException("Only pending leave requests can be cancelled");
        }
        leave.setStatus(LeaveStatus.CANCELLED);
        LeaveRequest saved = leaveRequestRepository.save(leave);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return leaveRequestRepository.countByStatus(LeaveStatus.PENDING);
    }

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private LeaveResponse toResponse(LeaveRequest l) {
        LeaveResponse dto = new LeaveResponse();
        dto.setId(l.getId());
        dto.setEmployeeId(l.getEmployee().getId());
        dto.setEmployeeName(l.getEmployee().getFirstName() + " " + l.getEmployee().getLastName());
        dto.setEmployeeCode(l.getEmployee().getEmployeeCode());
        dto.setDepartmentName(l.getEmployee().getDepartment() != null ? l.getEmployee().getDepartment().getName() : null);
        dto.setLeaveType(l.getLeaveType());
        dto.setStartDate(l.getStartDate());
        dto.setEndDate(l.getEndDate());
        dto.setDays(ChronoUnit.DAYS.between(l.getStartDate(), l.getEndDate()) + 1);
        dto.setReason(l.getReason());
        dto.setStatus(l.getStatus());
        dto.setAppliedOn(l.getAppliedOn());
        dto.setReviewedBy(l.getReviewedBy());
        dto.setReviewedOn(l.getReviewedOn());
        dto.setReviewComment(l.getReviewComment());
        return dto;
    }
}
