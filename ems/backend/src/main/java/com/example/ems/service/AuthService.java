package com.example.ems.service;

import com.example.ems.dto.AuthDtos.LoginRequest;
import com.example.ems.dto.AuthDtos.LoginResponse;
import com.example.ems.model.AuditAction;
import com.example.ems.model.User;
import com.example.ems.repository.UserRepository;
import com.example.ems.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager, UserRepository userRepository,
                        JwtService jwtService, AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    public LoginResponse login(LoginRequest request) {
        System.out.println("Username = [" + request.getUsername() + "]");
        String username = request.getUsername().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.getPassword()));
        User user = userRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

        String token = jwtService.generateToken(user.getUsername(), user.getRole().name());

        Long employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        String fullName = user.getEmployee() != null
                ? user.getEmployee().getFirstName() + " " + user.getEmployee().getLastName()
                : user.getUsername();

        auditService.log("User", user.getId(), AuditAction.LOGIN, user.getUsername() + " logged in");

        return new LoginResponse(token, user.getUsername(), user.getRole().name(), employeeId, fullName);
    }
}
