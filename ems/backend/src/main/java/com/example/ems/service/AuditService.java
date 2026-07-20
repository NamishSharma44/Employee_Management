package com.example.ems.service;

import com.example.ems.model.AuditAction;
import com.example.ems.model.AuditLog;
import com.example.ems.repository.AuditLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String entityType, Long entityId, AuditAction action, String details) {
        String performedBy = currentUsername();
        auditLogRepository.save(new AuditLog(entityType, entityId, action, performedBy, details));
    }

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
