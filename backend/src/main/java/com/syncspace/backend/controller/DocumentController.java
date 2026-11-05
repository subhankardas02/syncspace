
package com.syncspace.backend.controller;

import com.syncspace.backend.AppUser;
import com.syncspace.backend.Document;
import com.syncspace.backend.repository.DocumentRepository;
import com.syncspace.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentController(
            DocumentRepository documentRepository,
            UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    private AppUser getCurrentUser(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found"));
    }

    @GetMapping
    public List<Document> getAllDocuments(Authentication authentication) {
        AppUser user = getCurrentUser(authentication);

        return documentRepository.findByOwnerId(user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        return documentRepository
                .findByIdAndOwnerId(id, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createDocument(
            @RequestBody Document document,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        document.setOwner(user);

        Document savedDocument = documentRepository.save(document);

        return ResponseEntity.ok(savedDocument);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(
            @PathVariable Long id,
            @RequestBody Document updatedDocument,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        return documentRepository
                .findByIdAndOwnerId(id, user.getId())
                .map(document -> {
                    document.setTitle(updatedDocument.getTitle());
                    document.setContent(updatedDocument.getContent());

                    Document savedDocument = documentRepository.save(document);

                    return ResponseEntity.ok(savedDocument);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        return documentRepository
                .findByIdAndOwnerId(id, user.getId())
                .map(document -> {
                    documentRepository.delete(document);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
