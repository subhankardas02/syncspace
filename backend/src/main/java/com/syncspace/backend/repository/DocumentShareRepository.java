
package com.syncspace.backend.repository;

import com.syncspace.backend.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentShareRepository
        extends JpaRepository<DocumentShare, Long> {

    // Find all users who have access to a document.
    List<DocumentShare> findByDocumentId(Long documentId);

    // Find a particular user's permission for a document.
    Optional<DocumentShare> findByDocumentIdAndUserId(
            Long documentId,
            Long userId
    );

    // Check whether a user already has access.
    boolean existsByDocumentIdAndUserId(
            Long documentId,
            Long userId
    );

    // Find all documents shared with a particular user.
    List<DocumentShare> findByUserId(Long userId);
}
