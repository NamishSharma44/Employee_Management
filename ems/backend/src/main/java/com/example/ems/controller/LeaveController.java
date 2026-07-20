package com.example.ems.controller;

import com.example.ems.dto.LeaveDtos.LeaveCreateRequest;
import com.example.ems.dto.LeaveDtos.LeaveResponse;
import com.example.ems.dto.LeaveDtos.LeaveReviewRequest;
import com.example.ems.model.LeaveStatus;
import com.example.ems.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveResponse apply(@Valid @RequestBody LeaveCreateRequest request) {
        return leaveService.apply(request);
    }

    @GetMapping("/employee/{employeeId}")
    public Page<LeaveResponse> getByEmployee(@PathVariable Long employeeId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedOn"));
        return leaveService.getByEmployee(employeeId, pageable);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Page<LeaveResponse> getAll(@RequestParam(required = false) LeaveStatus status,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedOn"));
        return leaveService.getByStatus(status, pageable);
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public LeaveResponse review(@PathVariable Long id, @Valid @RequestBody LeaveReviewRequest request) {
        return leaveService.review(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public LeaveResponse cancel(@PathVariable Long id, @RequestParam Long employeeId) {
        return leaveService.cancel(id, employeeId);
    }
}
