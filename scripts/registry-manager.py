#!/usr/bin/env python3
"""
Adaptive cryptographic algorithm registry manager.
Continuous system for adding, deprecating, and updating algorithms.
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

class RegistryManager:
    def __init__(self, registry_path: str = "ALGORITHM_REGISTRY.json"):
        self.registry_path = Path(registry_path)
        self.deprecation_log = Path("DEPRECATION_LOG.json")
        self.update_log = Path("UPDATE_LOG.json")
        self.registry = self._load_registry()
        
    def _load_registry(self) -> Dict:
        if self.registry_path.exists():
            with open(self.registry_path) as f:
                return json.load(f)
        return {"algorithms": [], "metadata": {"created": datetime.now().isoformat()}}
    
    def _save_registry(self):
        self.registry["metadata"]["last_updated"] = datetime.now().isoformat()
        self.registry["metadata"]["total_algorithms"] = len(self.registry["algorithms"])
        
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def _log_deprecation(self, algo_id: str, reason: str, severity: str):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "algorithm": algo_id,
            "reason": reason,
            "severity": severity,
            "action": "deprecated"
        }
        
        logs = []
        if self.deprecation_log.exists():
            with open(self.deprecation_log) as f:
                logs = json.load(f)
        
        logs.append(log_entry)
        with open(self.deprecation_log, 'w') as f:
            json.dump(logs, f, indent=2)
    
    def _log_update(self, algo_id: str, changes: Dict[str, Any]):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "algorithm": algo_id,
            "changes": changes
        }
        
        logs = []
        if self.update_log.exists():
            with open(self.update_log) as f:
                logs = json.load(f)
        
        logs.append(log_entry)
        with open(self.update_log, 'w') as f:
            json.dump(logs, f, indent=2)
    
    def add_algorithm(self, algo: Dict) -> bool:
        """Add new algorithm to registry"""
        # Check if already exists
        existing = [a for a in self.registry["algorithms"] if a["id"] == algo["id"]]
        if existing:
            return False
        
        algo["status"] = algo.get("status", "ACTIVE")
        algo["added"] = datetime.now().isoformat()
        algo["version"] = 1
        
        self.registry["algorithms"].append(algo)
        self._save_registry()
        return True
    
    def deprecate_algorithm(self, algo_id: str, reason: str, severity: str = "MEDIUM") -> bool:
        """
        Deprecate an algorithm.
        Severity: LOW (minor issue), MEDIUM (known weakness), HIGH (broken), CRITICAL (catastrophic failure)
        """
        algo = next((a for a in self.registry["algorithms"] if a["id"] == algo_id), None)
        if not algo:
            return False
        
        old_status = algo.get("status", "ACTIVE")
        algo["status"] = "DEPRECATED"
        algo["deprecation_reason"] = reason
        algo["deprecation_severity"] = severity
        algo["deprecated_at"] = datetime.now().isoformat()
        algo["version"] = algo.get("version", 1) + 1
        
        self._log_deprecation(algo_id, reason, severity)
        self._log_update(algo_id, {"status": f"{old_status} -> DEPRECATED", "reason": reason})
        self._save_registry()
        return True
    
    def update_algorithm(self, algo_id: str, updates: Dict[str, Any]) -> bool:
        """Update algorithm metadata"""
        algo = next((a for a in self.registry["algorithms"] if a["id"] == algo_id), None)
        if not algo:
            return False
        
        changes = {}
        for key, value in updates.items():
            old_value = algo.get(key)
            if old_value != value:
                changes[key] = f"{old_value} -> {value}"
                algo[key] = value
        
        if changes:
            algo["version"] = algo.get("version", 1) + 1
            algo["last_modified"] = datetime.now().isoformat()
            self._log_update(algo_id, changes)
            self._save_registry()
            return True
        return False
    
    def reactivate_algorithm(self, algo_id: str, reason: str) -> bool:
        """Reactivate a deprecated algorithm"""
        algo = next((a for a in self.registry["algorithms"] if a["id"] == algo_id), None)
        if not algo:
            return False
        
        if algo.get("status") != "DEPRECATED":
            return False
        
        algo["status"] = "ACTIVE"
        algo["reactivation_reason"] = reason
        algo["reactivated_at"] = datetime.now().isoformat()
        algo["version"] = algo.get("version", 1) + 1
        
        self._log_update(algo_id, {"status": "DEPRECATED -> ACTIVE", "reason": reason})
        self._save_registry()
        return True
    
    def get_deprecated(self) -> List[Dict]:
        """Get all deprecated algorithms"""
        return [a for a in self.registry["algorithms"] if a.get("status") == "DEPRECATED"]
    
    def get_by_family(self, family: str) -> List[Dict]:
        """Get algorithms by family"""
        return [a for a in self.registry["algorithms"] if a.get("family") == family]
    
    def get_by_status(self, status: str) -> List[Dict]:
        """Get algorithms by status"""
        return [a for a in self.registry["algorithms"] if a.get("status") == status]
    
    def get_stats(self) -> Dict:
        """Get registry statistics"""
        algorithms = self.registry["algorithms"]
        return {
            "total": len(algorithms),
            "active": len([a for a in algorithms if a.get("status") == "ACTIVE"]),
            "deprecated": len([a for a in algorithms if a.get("status") == "DEPRECATED"]),
            "by_family": {},
            "by_security_level": {}
        }
    
    def generate_report(self) -> str:
        """Generate human-readable registry report"""
        stats = self.get_stats()
        deprecated = self.get_deprecated()
        
        report = []
        report.append("=" * 60)
        report.append("CRYPTOGRAPHIC ALGORITHM REGISTRY REPORT")
        report.append("=" * 60)
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append(f"Total algorithms: {stats['total']}")
        report.append(f"Active: {stats['active']}")
        report.append(f"Deprecated: {stats['deprecated']}")
        report.append("")
        
        if deprecated:
            report.append("DEPRECATED ALGORITHMS:")
            report.append("-" * 60)
            for algo in deprecated:
                report.append(f"  {algo['id']}")
                report.append(f"    Reason: {algo.get('deprecation_reason', 'N/A')}")
                report.append(f"    Severity: {algo.get('deprecation_severity', 'N/A')}")
                report.append(f"    Deprecated: {algo.get('deprecated_at', 'N/A')}")
                report.append("")
        
        return "\n".join(report)

if __name__ == "__main__":
    import sys
    
    manager = RegistryManager()
    
    if len(sys.argv) < 2:
        print("Usage: registry-manager.py <command> [args]")
        print("Commands:")
        print("  stats                          - Show registry statistics")
        print("  report                         - Generate full report")
        print("  deprecated                     - List deprecated algorithms")
        print("  add <json>                     - Add new algorithm")
        print("  deprecate <id> <reason> [severity] - Deprecate algorithm")
        print("  update <id> <json>             - Update algorithm")
        print("  reactivate <id> <reason>       - Reactivate algorithm")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "stats":
        stats = manager.get_stats()
        print(json.dumps(stats, indent=2))
    
    elif command == "report":
        print(manager.generate_report())
    
    elif command == "deprecated":
        deprecated = manager.get_deprecated()
        for algo in deprecated:
            print(f"{algo['id']}: {algo.get('deprecation_reason', 'N/A')}")
    
    elif command == "add" and len(sys.argv) > 2:
        algo = json.loads(sys.argv[2])
        if manager.add_algorithm(algo):
            print(f"Added: {algo['id']}")
        else:
            print(f"Failed to add (may already exist): {algo['id']}")
    
    elif command == "deprecate" and len(sys.argv) > 3:
        algo_id = sys.argv[2]
        reason = sys.argv[3]
        severity = sys.argv[4] if len(sys.argv) > 4 else "MEDIUM"
        if manager.deprecate_algorithm(algo_id, reason, severity):
            print(f"Deprecated: {algo_id}")
        else:
            print(f"Failed to deprecate: {algo_id}")
    
    elif command == "update" and len(sys.argv) > 3:
        algo_id = sys.argv[2]
        updates = json.loads(sys.argv[3])
        if manager.update_algorithm(algo_id, updates):
            print(f"Updated: {algo_id}")
        else:
            print(f"Failed to update: {algo_id}")
    
    elif command == "reactivate" and len(sys.argv) > 3:
        algo_id = sys.argv[2]
        reason = sys.argv[3]
        if manager.reactivate_algorithm(algo_id, reason):
            print(f"Reactivated: {algo_id}")
        else:
            print(f"Failed to reactivate: {algo_id}")
    
    else:
        print(f"Unknown command or missing arguments: {command}")
        sys.exit(1)
